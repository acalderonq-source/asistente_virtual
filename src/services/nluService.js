const { parseRelativeDateTime } = require('./timeParser');

function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD") // quita tildes
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Saca una placa si viene tipo 170900, 178439, etc.
function extractPlaca(msg) {
  const match = msg.match(/\b\d{5,6}\b/);
  return match ? match[0] : null;
}

// Detecta intención
function detectIntent(rawMsg) {
  const msg = normalize(rawMsg);

  // --- crear_recordatorio ---
  // Casos explícitos
  if (
    msg.startsWith('recordame') ||
    msg.startsWith('recordar') ||
    msg.startsWith('recorda') ||
    msg.includes('recordatorio') ||
    msg.includes('acordate') ||
    msg.includes('poneme alarma') ||
    msg.includes('poneme un recordatorio') ||
    msg.startsWith('crea un recordatorio') ||
    msg.startsWith('creame un recordatorio') ||
    msg.startsWith('haceme un recordatorio')
  ) {
    return 'crear_recordatorio';
  }

  // Caso implícito tipo:
  // "miercoles tengo una reunion de ventas a las 9:00am"
  // "viernes inspeccion dekra a las 8 am"
  // patrón: <dia_semana> ... "a las" <hora>
  const diasSemanaRegex = /(lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo)/;
  const horaRegex = /a las?\s+\d{1,2}(:\d{2})?\s*(am|pm)?/;
  if (diasSemanaRegex.test(msg) && horaRegex.test(msg)) {
    return 'crear_recordatorio';
  }

  // --- agenda_consulta ---
  if (
    msg.includes('agenda') ||
    msg.includes('que tengo hoy') ||
    msg.includes('que hay hoy') ||
    msg.includes('pendientes de hoy') ||
    msg.includes('que tengo manana') ||
    msg.includes('que tengo mañana') ||
    msg.includes('pendientes de manana') ||
    msg.includes('pendientes de mañana') ||
    msg.includes('que tengo el sabado') ||
    msg.includes('que tengo sabado') ||
    msg.includes('que tengo sábado') ||
    msg.includes('pendiente sabado') ||
    msg.includes('pendiente sábado') ||
    msg.includes('pendientes sabado') ||
    msg.includes('pendientes sábado') ||
    msg.includes('que tengo domingo') ||
    msg.includes('que tengo lunes') ||
    msg.includes('que tengo martes') ||
    msg.includes('que tengo miercoles') ||
    msg.includes('que tengo miércoles') ||
    msg.includes('que tengo jueves') ||
    msg.includes('que tengo viernes')
  ) {
    return 'agenda_consulta';
  }

  // --- estado_unidad ---
  if (
    msg.includes('estado de la') ||
    msg.includes('estado de el') ||
    msg.includes('estado de la placa') ||
    msg.includes('como esta la') ||
    msg.includes('como esta el') ||
    msg.includes('puede salir') ||
    msg.includes('esta apta') ||
    msg.includes('puede salir a ruta') ||
    msg.includes('puede salir la') ||
    msg.includes('puede salir el')
  ) {
    return 'estado_unidad';
  }

  // --- saludo ---
  if (
    msg.includes('buenos dias') ||
    msg.includes('buenas tardes') ||
    msg.includes('buenas noches') ||
    msg.includes('gracias') ||
    msg.includes('ok') ||
    msg.includes('esta ahi') ||
    msg.includes('estas ahi') ||
    msg.includes('me escuchas')
  ) {
    return 'saludo';
  }

  return 'desconocido';
}


// Para recordatorio: extraemos hora y descripción
function extractReminderInfo(rawMsg, nowInCostaRica) {
  // nowInCostaRica = new Date() ajustado a tu zona local (-06:00) antes de pasar aquí

  // parse fecha/hora relativa
  const { fechaStr, leftoverText } = parseRelativeDateTime(rawMsg, nowInCostaRica);

  // mensaje = lo que queda diciendo qué hay que hacer
  // limpiemos triggers tipo "recordame", "recordatorio", etc.
  let msgClean = leftoverText
    .replace(/^(recordame|recordar|recorda|crea un recordatorio|creame un recordatorio|haceme un recordatorio|poneme alarma|poneme un recordatorio)/i, '')
    .trim();

  // también quitemos fragmentos tipo "mañana", "hoy", "a las 2 pm"
  msgClean = msgClean
    .replace(/\b(hoy|manana|mañana)\b/gi, '')
    .replace(/\ba las?\s+\d{1,2}(:\d{2})?\s*(am|pm)?/gi, '')
    .replace(/\b\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}\b/gi, '')
    .trim();

  return {
    fechaStr,
    textoRecordatorio: msgClean || 'Recordatorio sin detalle'
  };
}

module.exports = {
  detectIntent,
  extractReminderInfo,
  extractPlaca,
};
