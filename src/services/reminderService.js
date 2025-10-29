// src/services/reminderService.js
const { getPool } = require('../db');

// Normaliza "YYYY-MM-DD HH:MM" o "YYYY-MM-DD HH:MM:SS" -> siempre con segundos
function ensureMySQLDateTime(fechaStr) {
  const m = (fechaStr || '').match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const day = m[1];
  const hm  = m[2];
  const ss  = m[3] ? `:${m[3]}` : ':00';
  return `${day} ${hm}${ss}`;
}

// Crear nuevo recordatorio
async function createReminder({ mensaje, fecha, prioridad }) {
  const pool = getPool();

  const fechaOk = ensureMySQLDateTime(fecha);
  if (!fechaOk) {
    const err = new Error(`Fecha inválida para MySQL: "${fecha}"`);
    console.error('createReminder VALIDATION:', err.message);
    throw err;
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO Recordatorios (mensaje, fecha, prioridad, enviado, completado) VALUES (?, ?, ?, 0, 0)",
      [mensaje, fechaOk, prioridad || 'media']
    );
    return result.insertId;
  } catch (err) {
    console.error('DB createReminder ERROR:', err.code, err.message, { mensaje, fecha: fechaOk });
    throw err;
  }
}

// Recordatorios vencidos y no enviados
async function getDueReminders() {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT * FROM Recordatorios WHERE enviado = 0 AND fecha <= NOW() ORDER BY fecha ASC"
  );
  return rows;
}

// marcar que ya fue enviado (notificado)
async function markAsSent(id) {
  const pool = getPool();
  await pool.query("UPDATE Recordatorios SET enviado = 1 WHERE id = ?", [id]);
}

// marcar completado (sí)
async function markAsCompleted(id) {
  const pool = getPool();
  await pool.query("UPDATE Recordatorios SET completado = 1 WHERE id = ?", [id]);
}

// marcar no completado (no)
async function markAsNotCompleted(id) {
  const pool = getPool();
  await pool.query("UPDATE Recordatorios SET completado = 0 WHERE id = ?", [id]);
}

// eliminar por id
async function deleteReminderById(id) {
  const pool = getPool();
  await pool.query("DELETE FROM Recordatorios WHERE id = ?", [id]);
}

// rango de recordatorios (para agenda)
async function getRemindersInRange(startYMD, endYMD) {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT * FROM Recordatorios WHERE DATE(fecha) BETWEEN ? AND ? ORDER BY fecha ASC",
    [startYMD, endYMD]
  );
  return rows;
}

// último recordatorio enviado y aún no completado
async function getLastSentNotAnswered() {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT * FROM Recordatorios WHERE enviado = 1 AND completado = 0 ORDER BY fecha DESC LIMIT 1"
  );
  return rows[0] || null;
}

// buscar por fragmento de texto (para borrar por descripción)
async function findReminderByTextFragment(fragment) {
  const pool = getPool();
  const like = `%${fragment}%`;
  const [rows] = await pool.query(
    "SELECT * FROM Recordatorios WHERE mensaje LIKE ? ORDER BY fecha DESC LIMIT 1",
    [like]
  );
  return rows[0] || null;
}

module.exports = {
  createReminder,
  getDueReminders,
  markAsSent,
  markAsCompleted,
  markAsNotCompleted,
  deleteReminderById,
  getRemindersInRange,
  getLastSentNotAnswered,
  findReminderByTextFragment,
};
