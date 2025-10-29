function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function getIntent(rawMsg) {
  const msg = normalize(rawMsg);

  // === 1) CREAR RECORDATORIO: priorizar verbos AGENDAR/PROGRAMAR/RECORDAR ===
  // Soporta: "agenda ...", "agendar ...", "agendame ...", "programa ...",
  // "poneme un recordatorio ...", "recordame ..."
  const crearRegex =
    /^(agenda|agend(a|á|ame|ar)|program(a|ar|ame)|pon(e|eme)\s+(un\s+)?recordatorio|recorda(me)?|recordame|haceme\s+un\s+recordatorio|crea(me)?\s+un\s+recordatorio|poneme\s+alarma)/;
  const diasSemanaRegex = /(lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo)/;
  const horaRegex = /a las?\s+\d{1,2}(:\d{2})?\s*(am|pm)?/;

  if (crearRegex.test(msg) || (diasSemanaRegex.test(msg) && horaRegex.test(msg))) {
    return 'crear_recordatorio';
  }

  // === 2) CONSULTAR AGENDA (sustantivo), evitar confundir con el verbo ===
  // Frases tipo: "mi agenda", "que hay en la agenda", "que tengo hoy/mañana/este mes"
  const consultaAgendaRegex =
    /(mi\s+agenda|que\s+(tengo|hay)|pendientes|recordatorios|este\s+mes|esta\s+semana|hoy|mañana|manana|sabado|sábado)\b/;
  if (consultaAgendaRegex.test(msg)) {
    return 'consultar_agenda';
  }

  // === 3) ESTADO UNIDAD ===
  const placaRegex = /\b\d{5,6}\b/;
  const estadoKeywords = [
    'puede salir','puede salir a ruta','apta para ruta',
    'esta apta','esta apto','estado de la','estado de el',
    'como esta la','como esta el'
  ];
  if (placaRegex.test(msg) && estadoKeywords.some(k => msg.includes(k))) {
    return 'estado_unidad';
  }

  // === 4) BUSCAR INFO ===
  const infoKeywords = [
    'decime','dime','mostrame','muestreme','pasame','buscar info',
    'quien manejo','quién manejó','cuantos kilos','cuánto movió',
    'que pendiente tengo con','que pendiente hay con','que info hay de',
    'dekra','quick pass','proveedur'
  ];
  if (infoKeywords.some(k => msg.includes(k))) {
    return 'buscar_info';
  }

  // === 5) SALUDO ===
  const saludoKeywords = [
    'hola','buenos dias','buenas tardes','buenas noches',
    'gracias','ok','estas ahi','me escuchas','todo bien','pura vida'
  ];
  if (saludoKeywords.some(k => msg.includes(k))) {
    return 'saludo';
  }

  return 'desconocido';
}

module.exports = { getIntent };
