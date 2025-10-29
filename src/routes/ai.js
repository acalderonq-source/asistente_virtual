const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

// Endpoint para probar el "cerebro general"
router.post('/preguntar', async (req, res) => {
  try {
    const { pregunta } = req.body;
    const respuesta = await aiService.askAssistant(pregunta || '');
    res.json({ ok: true, respuesta });
  } catch (err) {
    console.error('Error /api/ia/preguntar:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
