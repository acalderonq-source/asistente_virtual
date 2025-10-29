const express = require('express');
const router = express.Router();
const reminderService = require('../services/reminderService');

// Crear recordatorio vía HTTP
router.post('/', async (req, res) => {
  try {
    const { mensaje, fecha, prioridad } = req.body;
    const id = await reminderService.createReminder({
      mensaje,
      fecha,
      prioridad: prioridad || 'media'
    });
    res.json({ ok: true, id, mensaje: 'Recordatorio creado' });
  } catch (err) {
    console.error('Error creando recordatorio API:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Listar futuros
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = (now.getMonth() + 1).toString().padStart(2,'0');
    const dd = now.getDate().toString().padStart(2,'0');
    const todayYMD = `${yyyy}-${mm}-${dd}`;

    const data = await reminderService.getRemindersInRange(todayYMD, '2999-12-31');
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Error listando recordatorios:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
