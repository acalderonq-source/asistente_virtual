function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function getIntent(rawMsg) {
  const msg = normalize(rawMsg);

  // crear_recordatorio
  const crearKeywords = [
    'recordame','recordar','recorda',
    'haceme un recordatorio','crea un recordatorio','creame un recordatorio',
    'poneme alarma','poneme un recordatorio','acordate que','acordate de'
  ];
  const diasSemanaRegex = /(lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo)/;
  const horaRegex = /a las?\s+\d{1,2}(:\d{2})?\s*(am|pm)?/;

  if (
    crearKeywords.some(k => msg.startsWith(k) || msg.includes(k)) ||
    (diasSemanaRegex.test(msg) && horaRegex.test(msg))
  ) {
    return 'crear_recordatorio';
  }

  // consultar_agenda
  const agendaKeywords = [
    'agenda','pendientes','que tengo','que hay',
    'tengo algo','que me toca','que queda',
    'recordatorios','recordatorio',
    'este mes','esta semana','este fin de semana','para el mes','que hay este mes'
  ];
  if (agendaKeywords.some(k => msg.includes(k))) {
    return 'consultar_agenda';
  }

  // estado_unidad
  const placaRegex = /\b\d{5,6}\b/;
  const estadoKeywords = [
    'puede salir','puede salir a ruta','apta para ruta',
    'esta apta','esta apto','estado de la','estado de el',
    'como esta la','como esta el'
  ];
  if (placaRegex.test(msg) && estadoKeywords.some(k => msg.includes(k))) {
    return 'estado_unidad';
  }

  // buscar_info operativa
  const infoKeywords = [
    'decime','dime','mostrame','muestreme','pasame','busque',
    'buscar info','cual es el estado','quien manejo','quién manejó',
    'cuantos kilos','cuánto movió','quien llevaba',
    'que pendiente tengo con','que pendiente hay con',
    'que info hay de'
  ];
  if (infoKeywords.some(k => msg.includes(k))) {
    return 'buscar_info';
  }

  // saludo / trato humano
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
