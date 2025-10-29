const { getPool } = require('../db');

async function createReminder({ mensaje, fecha, prioridad }) {
  const pool = getPool();
  const [result] = await pool.query(
    "INSERT INTO Recordatorios (mensaje, fecha, prioridad, enviado, completado) VALUES (?, ?, ?, 0, 0)",
    [mensaje, fecha, prioridad || 'media']
  );
  return result.insertId;
}

async function getDueReminders() {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT * FROM Recordatorios WHERE enviado = 0 AND fecha <= NOW() ORDER BY fecha ASC"
  );
  return rows;
}

async function markAsSent(id) {
  const pool = getPool();
  await pool.query(
    "UPDATE Recordatorios SET enviado = 1 WHERE id = ?",
    [id]
  );
}

async function markAsCompleted(id) {
  const pool = getPool();
  await pool.query(
    "UPDATE Recordatorios SET completado = 1 WHERE id = ?",
    [id]
  );
}

async function markAsNotCompleted(id) {
  const pool = getPool();
  await pool.query(
    "UPDATE Recordatorios SET completado = 0 WHERE id = ?",
    [id]
  );
}

async function deleteReminderById(id) {
  const pool = getPool();
  await pool.query(
    "DELETE FROM Recordatorios WHERE id = ?",
    [id]
  );
}

async function getRemindersInRange(startYMD, endYMD) {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT * FROM Recordatorios WHERE DATE(fecha) BETWEEN ? AND ? ORDER BY fecha ASC",
    [startYMD, endYMD]
  );
  return rows;
}

async function getLastSentNotAnswered() {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT * FROM Recordatorios WHERE enviado = 1 AND completado = 0 ORDER BY fecha DESC LIMIT 1"
  );
  return rows[0] || null;
}

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
