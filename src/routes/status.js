const express = require('express');
const router = express.Router();
const { getPool } = require('../db');

// Estado de una unidad por placa
router.get('/unidad/:placa', async (req, res) => {
  const placa = req.params.placa;
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT * FROM Unidades WHERE placa = ? LIMIT 1",
      [placa]
    );
    if (!rows.length) {
      return res.json({ ok: false, msg: 'No hay datos de esa placa' });
    }
    const u = rows[0];
    res.json({ ok: true, data: u });
  } catch (err) {
    console.error('Error estado unidad:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
