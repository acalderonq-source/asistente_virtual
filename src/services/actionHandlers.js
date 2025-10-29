const { getPool } = require('../db');
const reminderService = require('./reminderService');
const aiService = require('./aiService');

// Crear recordatorio
async function handleCrearRecordatorio(rawMsg, entities) {
  const { fechaStr, texto } = entities.reminder;

  const insertId = await reminderService.createReminder({
    mensaje: texto,
    fecha: fechaStr,
    prioridad: 'media'
  });

  return (
    `✅ Quedó agendado (#${insertId}):\n` +
    `• ${texto}\n` +
    `• ${fechaStr}\n\n` +
    `Te voy a avisar y luego te pregunto si se hizo.`
  );
}

// Consultar agenda rango (hoy, mañana, sábado, esta semana, este mes)
async function handleConsultarAgenda(rangeInfoOrText) {
  let startYMD, endYMD;

  if (typeof rangeInfoOrText === 'string') {
    startYMD = rangeInfoOrText;
    endYMD = rangeInfoOrText;
  } else {
    startYMD = rangeInfoOrText.startYMD;
    endYMD   = rangeInfoOrText.endYMD;
  }

  const rows = await reminderService.getRemindersInRange(startYMD, endYMD);

  if (!rows.length) {
    return `📋 No hay recordatorios entre ${startYMD} y ${endYMD}.`;
  }

  const lines = rows.map(r => {
    const iso = r.fecha.toISOString();
    const fechaStr = iso.slice(0,10);
    const hhmm = iso.slice(11,16);
    const done = r.completado ? '✅' : '⏳';
    return `• #${r.id} ${fechaStr} ${hhmm} ${done} - ${r.mensaje} [${r.prioridad}]`;
  }).join('\n');

  return (
    `📋 Recordatorios del ${startYMD} al ${endYMD}:\n` +
    lines
  );
}

// Placa / estado ruta
async function handleEstadoUnidad(placa) {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT * FROM Unidades WHERE placa = ? LIMIT 1",
    [placa]
  );

  if (!rows.length) {
    return `No tengo información guardada para la placa ${placa}.`;
  }

  const u = rows[0];

  let apta = "APTA para ruta ✅";
  if (u.falla_grave || (u.vida_util_porcentaje !== null && u.vida_util_porcentaje < 30)) {
    apta = "NO APTA para ruta ❌";
  }

  return (
    `🚛 Placa ${u.placa} (${u.sede || 'sin sede'})\n` +
    `• Estado: ${u.estado_general || 'sin detalle'}\n` +
    `• Vida útil: ${u.vida_util_porcentaje ?? 'N/D'}%\n` +
    `• Falla grave: ${u.falla_grave ? 'Sí' : 'No'}\n` +
    `⇒ ${apta}`
  );
}

// Info operativa: quién manejó, kilos movidos, vida útil
async function handleBuscarInfo(infoQuery) {
  const pool = getPool();
  const { placa, fechaYmd, tema, raw } = infoQuery;

  // caso: placa + fecha -> chofer, kilos
  if (placa && fechaYmd) {
    const [rows] = await pool.query(
      "SELECT * FROM Choferes WHERE placa_camion = ? AND fecha = ? ORDER BY id DESC LIMIT 1",
      [placa, fechaYmd]
    );

    if (!rows.length) {
      return `No tengo registro para la ${placa} en ${fechaYmd}.`;
    }

    const r = rows[0];

    if (tema === 'kilos') {
      return (
        `El camión ${r.placa_camion} movió ${r.kilos || 'N/D'} kg el ${fechaYmd} ` +
        `con el tanque ${r.placa_tanque || 'N/D'}.`
      );
    }

    if (tema === 'chofer') {
      return (
        `El chofer fue ${r.nombre || 'N/D'} con el camión ${r.placa_camion} ` +
        `y el tanque ${r.placa_tanque || 'N/D'} el ${fechaYmd}.`
      );
    }

    return (
      `📦 Movimiento ${fechaYmd} para camión ${r.placa_camion}:\n` +
      `• Chofer: ${r.nombre || 'N/D'}\n` +
      `• Tanque: ${r.placa_tanque || 'N/D'}\n` +
      `• Transportista: ${r.transportista || 'N/D'}\n` +
      `• Kilos: ${r.kilos || 'N/D'}`
    );
  }

  // caso: vida útil / estado técnico de la placa
  if (placa && tema === 'vida_util') {
    const [rows] = await pool.query(
      "SELECT placa, vida_util_porcentaje, falla_grave, estado_general, sede FROM Unidades WHERE placa = ? LIMIT 1",
      [placa]
    );
    if (!rows.length) {
      return `No tengo datos guardados para la placa ${placa}.`;
    }
    const u = rows[0];
    return (
      `🔧 Vida útil de ${u.placa} (${u.sede || 'sin sede'}):\n` +
      `• ${u.vida_util_porcentaje ?? 'N/D'}%\n` +
      `• Falla grave: ${u.falla_grave ? 'Sí' : 'No'}\n` +
      `• Estado: ${u.estado_general || 'sin detalle'}`
    );
  }

  // Temas administrativos tipo Dekra / Quick Pass / Proveeduría
  if (tema === 'quick pass' || tema === 'dekra' || tema === 'proveeduría') {
    // Primero buscamos notas internas
    try {
      const [rows] = await pool.query(
        "SELECT * FROM NotasOperacion WHERE tema LIKE ? ORDER BY fecha DESC LIMIT 3",
        [tema + '%']
      );

      if (rows.length) {
        const lines = rows.map(n =>
          `• ${n.detalle} (${n.fecha.toISOString().slice(0,16).replace('T',' ')})`
        ).join('\n');

        return (
          `📒 Último estado interno sobre ${tema}:\n` +
          lines
        );
      }
    } catch (_) {
      // no hay tabla o no hay datos -> seguimos al fallback
    }

    return `No tengo notas guardadas sobre ${tema} todavía.`;
  }

  // fallback de buscar_info
  return (
    'Te puedo buscar:\n' +
    '• Quién manejó una placa ayer/hoy y cuántos kilos movió.\n' +
    '• Vida útil / si puede salir a ruta.\n' +
    '• Notas internas sobre Dekra / Quick Pass / Proveeduría.\n' +
    '• Tus pendientes este mes / esta semana / sábado.\n' +
    'Ejemplo: "decime quién manejó la 178439 ayer", "qué tengo este mes", "qué dijo Dekra".'
  );
}

async function handleSaludo() {
  return 'Hola 👋. ¿Querés que agende algo o reviso tu agenda?';
}

async function handleDesconocido(rawMsg) {
  const baseReply = await aiService.askAssistant(rawMsg);
  return baseReply;
}

module.exports = {
  handleCrearRecordatorio,
  handleConsultarAgenda,
  handleEstadoUnidad,
  handleBuscarInfo,
  handleSaludo,
  handleDesconocido,
};
