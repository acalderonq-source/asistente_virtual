const { getIntent } = require('./intentClassifier');
const {
  extractPlaca,
  extractReminderParts,
  extractAgendaRangeForQuery,
  extractInfoQuery,
} = require('./entityExtractor');

const {
  handleCrearRecordatorio,
  handleConsultarAgenda,
  handleEstadoUnidad,
  handleBuscarInfo,
  handleSaludo,
  handleDesconocido,
} = require('./actionHandlers');

async function handleUserMessage(rawMsg) {
  const intent = getIntent(rawMsg);
  const now = new Date();

  if (intent === 'crear_recordatorio') {
    const reminder = extractReminderParts(rawMsg, now);
    return await handleCrearRecordatorio(rawMsg, { reminder });
  }

  if (intent === 'consultar_agenda') {
    const rangeInfo = extractAgendaRangeForQuery(rawMsg, now); // {startYMD,endYMD}
    return await handleConsultarAgenda(rangeInfo);
  }

  if (intent === 'estado_unidad') {
    const placa = extractPlaca(rawMsg);
    if (!placa) {
      return '¿Cuál placa querés que revise? Ejemplo: "estado de la 170900".';
    }
    return await handleEstadoUnidad(placa);
  }

  if (intent === 'buscar_info') {
    const infoQuery = extractInfoQuery(rawMsg, now);
    return await handleBuscarInfo(infoQuery);
  }

  if (intent === 'saludo') {
    return await handleSaludo();
  }

  return await handleDesconocido(rawMsg);
}

module.exports = { handleUserMessage };
