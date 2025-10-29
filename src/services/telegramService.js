const { Telegraf } = require('telegraf');
const { handleUserMessage } = require('./messageBrain');
const reminderService = require('./reminderService');

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const allowedChatId = process.env.TELEGRAM_CHAT_ID;

let bot = null;
if (botToken) {
  bot = new Telegraf(botToken);
}

// Enviar mensaje de sistema (cron usa esto)
async function notify(text) {
  if (!bot || !allowedChatId) {
    console.warn('Telegram no configurado. Mensaje sería:', text);
    return;
  }
  try {
    await bot.telegram.sendMessage(allowedChatId, text);
  } catch (err) {
    console.error('Error enviando Telegram:', err.message);
  }
}

// Manejo rápido de "si / no" y "elimina ..."
async function handleQuickReplies(userMsg) {
  const msg = userMsg.toLowerCase().trim();

  // Borrar recordatorio por descripción
  if (
    msg.startsWith('elimina') ||
    msg.startsWith('eliminar') ||
    msg.startsWith('borra') ||
    msg.startsWith('borrar')
  ) {
    // Ej: "elimina la cita dekra", "borra recordatorio 12"
    // Intentar sacar un posible ID
    const idMatch = msg.match(/(\d+)/);
    if (idMatch) {
      const idNum = idMatch[1];
      await reminderService.deleteReminderById(idNum);
      return `Listo. Eliminé el recordatorio #${idNum}.`;
    }

    // Si no hay número, usar texto
    const words = msg.split(' ');
    words.shift(); // quitar "elimina"/"borra"
    const fragment = words.join(' ').trim();

    if (!fragment) {
      return "Decime qué recordatorio querés borrar.";
    }

    const found = await reminderService.findReminderByTextFragment(fragment);
    if (!found) {
      return "No encontré nada con esa descripción.";
    }

    await reminderService.deleteReminderById(found.id);
    return `Listo. Eliminé el recordatorio #${found.id} (${found.mensaje}).`;
  }

  // Marcar completado
  if (
    msg === 'si' ||
    msg === 'sí' ||
    msg === 'ya' ||
    msg === 'listo' ||
    msg === 'hecho'
  ) {
    const last = await reminderService.getLastSentNotAnswered();
    if (!last) {
      return "No tengo nada pendiente para marcar como hecho.";
    }

    await reminderService.markAsCompleted(last.id);
    return `Perfecto ✅ Quedó marcado como realizado (#${last.id}: ${last.mensaje}).`;
  }

  // Marcar no completado
  if (
    msg === 'no' ||
    msg === 'todavia' ||
    msg === 'todavía' ||
    msg === 'aun' ||
    msg === 'aún'
  ) {
    const last = await reminderService.getLastSentNotAnswered();
    if (!last) {
      return "No tengo nada pendiente para marcar como NO hecho.";
    }

    await reminderService.markAsNotCompleted(last.id);
    return `Ok, lo dejo pendiente (#${last.id}: ${last.mensaje}).`;
  }

  return null;
}

// Escuchar mensajes de Telegram
async function startListener() {
  if (!bot) {
    console.warn('No hay bot inicializado, no puedo escuchar mensajes.');
    return;
  }

  bot.on('text', async (ctx) => {
    const fromChat = ctx.chat.id.toString();
    const rawMsg = ctx.message.text || '';

    // Seguridad: solo el chat autorizado
    if (allowedChatId && fromChat !== allowedChatId) {
      return ctx.reply('No estoy autorizado para este chat.');
    }

    try {
      // 1. Primero intentamos sí/no/borrar
      const quick = await handleQuickReplies(rawMsg);
      if (quick) {
        return ctx.reply(quick);
      }

      // 2. Si no es sí/no/borrar, pasamos al cerebro normal
      const respuesta = await handleUserMessage(rawMsg);
      return ctx.reply(respuesta);

    } catch (err) {
      console.error('Error procesando mensaje:', err.message);
      return ctx.reply('Hubo un problema procesando eso.');
    }
  });

  bot.launch();
}

module.exports = {
  notify,
  startListener,
};
