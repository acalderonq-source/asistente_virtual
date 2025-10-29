// src/db/index.js
const mysql = require('mysql2/promise');

let pool;

function showCfg() {
  return {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    // NO mostramos el password en logs
  };
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function init() {
  const cfg = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 15000, // 15s
  };

  if (!cfg.host || !cfg.user || !cfg.database) {
    console.error('❌ DB env incompletas:', showCfg());
    throw new Error('Variables DB_* incompletas');
  }

  let lastErr;
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      pool = mysql.createPool(cfg);
      const conn = await pool.getConnection(); // fuerza conexión
      await conn.query('SELECT 1'); // ping
      conn.release();
      console.log('✅ DB conectada con:', showCfg());
      break;
    } catch (err) {
      lastErr = err;
      const code = err.code || err.errno || 'UNKNOWN';
      const msg = err.sqlMessage || err.message || String(err);
      console.error(`⏳ Intento ${attempt}/8 → DB connect error:`, code, msg, 'cfg:', showCfg());
      await sleep(2000 * attempt); // backoff 2s,4s,6s...
    }
  }

  if (!pool) {
    throw lastErr || new Error('No se pudo crear el pool MySQL');
  }

  try {
    // Tablas
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS NotasOperacion (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tema VARCHAR(100),
        detalle TEXT,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    const code = err.code || 'UNKNOWN';
    const msg = err.sqlMessage || err.message || String(err);
    console.error('❌ Error creando tablas:', code, msg);
    throw err;
  }

  return pool;
}

function getPool() {
  if (!pool) throw new Error('DB pool no inicializado');
  return pool;
}

module.exports = { init, getPool };
