// server.js
// Servidor principal del asistente virtual

require('dotenv').config(); // carga variables .env

const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const { format } = require('date-fns');

const db = require('./src/db'); // ./src/db/index.js
const reminderService = require('./src/services/reminderService');
const telegramService = require('./src/services/telegramService');

const remindersRouter = require('./src/routes/reminders');
const statusRouter = require('./src/routes/status');
const aiRouter = require('./src/routes/ai');

const app = express();
app.use(bodyParser.json());

// Rutas HTTP de utilidad
app.use('/api/reminders', remindersRouter);
app.use('/api/status', statusRouter);
app.use('/api/ia', aiRouter);

// Ruta raíz: salud del server
app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'Asistente virtual corriendo',
    hora_server: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
  });
});

// CRON: corre cada minuto.
// - Busca recordatorios vencidos y no enviados.
// - Te los manda por Telegram y pregunta “¿Se realizó ya? si / no”.
// - Marca como "enviado" para no repetir.
cron.schedule('* * * * *', async () => {
  try {
    const pendientes = await reminderService.getDueReminders();

    for (const r of pendientes) {
      const text =
        `🔔 Recordatorio #${r.id}\n` +
        `${r.mensaje}\n` +
        `(${format(r.fecha, 'yyyy-MM-dd HH:mm')})\n\n` +
        `¿Se realizó ya? Respondé: si / no`;

      try {
        await telegramService.notify(text);
      } catch (errTel) {
        console.error('Error enviando Telegram:', errTel.message);
      }

      try {
        await reminderService.markAsSent(r.id);
      } catch (errMark) {
        console.error('Error marcando recordatorio como enviado:', errMark.message);
      }
    }
  } catch (err) {
    console.error('Error en cron recordatorios:', err.message);
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`✅ Servidor escuchando en puerto ${PORT}`);

  try {
    await db.init();
    console.log('✅ Conexión MySQL lista');
  } catch (err) {
    console.error('❌ Error inicializando DB:', err.message);
  }

  try {
    await telegramService.startListener();
    console.log('✅ Bot Telegram escuchando mensajes entrantes');
  } catch (err) {
    console.error('❌ No se pudo iniciar listener Telegram:', err.message);
  }

  console.log('🚀 Asistente listo.');
});
