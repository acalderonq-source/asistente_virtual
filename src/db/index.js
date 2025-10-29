const mysql = require('mysql2/promise');

let pool;

async function init() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });
  }

  // Recordatorios: ahora con 'enviado' y 'completado'
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Recordatorios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mensaje TEXT NOT NULL,
      fecha DATETIME NOT NULL,
      prioridad VARCHAR(20) DEFAULT 'media',
      enviado TINYINT DEFAULT 0,
      completado TINYINT DEFAULT 0
    )
  `);

  // Unidades (estado mecánico / ruta)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Unidades (
      id INT AUTO_INCREMENT PRIMARY KEY,
      placa VARCHAR(20) UNIQUE,
      sede VARCHAR(100),
      estado_general TEXT,
      vida_util_porcentaje INT,
      falla_grave TINYINT DEFAULT 0
    )
  `);

  // Choferes (movimiento operativo por día)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Choferes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(200),
      placa_camion VARCHAR(20),
      placa_tanque VARCHAR(20),
      kilos INT,
      transportista VARCHAR(200),
      fecha DATE
    )
  `);

  // NotasOperacion opcional (Dekra / Quick Pass / etc.)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS NotasOperacion (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tema VARCHAR(100),
      detalle TEXT,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('DB pool no inicializado');
  }
  return pool;
}

module.exports = { init, getPool };
