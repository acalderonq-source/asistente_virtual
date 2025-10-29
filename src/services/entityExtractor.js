const {
  parseExplicitOrRelative,
  parseReminderNatural,
  extractAgendaRange,
} = require('./timeParser');

function extractPlaca(rawMsg) {
  const m = rawMsg.match(/\b\d{5,6}\b/);
  return m ? m[0] : null;
}

// Para crear recordatorio
function extractReminderParts(rawMsg, now) {
  let { fechaStr, textoRecordatorio } = parseReminderNatural(rawMsg, now);

  if (!fechaStr || !textoRecordatorio) {
    const rel = parseExplicitOrRelative(rawMsg, now);
    if (rel.fechaStr) {
      fechaStr = rel.fechaStr;
    }
    if (rel.mode) {
      textoRecordatorio = rawMsg
        .replace(rel.consumedWord || '', '')
        .replace(rel.consumedHourWord || '', '')
        .replace(/recordame|recordar|recorda|crea un recordatorio|creame un recordatorio|haceme un recordatorio|poneme alarma|poneme un recordatorio|acordate que|acordate de/gi, '')
        .trim() || 'Recordatorio';
    }
  }

  if (!fechaStr) {
    const fallbackDate = new Date(now.getTime() + 10 * 60 * 1000);
    const yyyy = fallbackDate.getFullYear();
    const mm = (fallbackDate.getMonth() + 1).toString().padStart(2, '0');
    const dd = fallbackDate.getDate().toString().padStart(2, '0');
    const HH = fallbackDate.getHours().toString().padStart(2, '0');
    const MM = fallbackDate.getMinutes().toString().padStart(2, '0');
    fechaStr = `${yyyy}-${mm}-${dd} ${HH}:${MM}`;
  }
  if (!textoRecordatorio) {
    textoRecordatorio = 'Recordatorio';
  }

  return { fechaStr, texto: textoRecordatorio };
}

// Para consultar agenda "este mes", "sábado", "esta semana"
function extractAgendaRangeForQuery(rawMsg, now) {
  return extractAgendaRange(rawMsg, now); // { startYMD, endYMD }
}

// Para buscar info operativa
function extractInfoQuery(rawMsg, now) {
  const lower = rawMsg.toLowerCase();
  const placa = extractPlaca(rawMsg);

  let fechaYmd = null;
  if (lower.includes('ayer')) {
    const d = new Date(now.getTime());
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm = (d.getMonth()+1).toString().padStart(2,'0');
    const dd = d.getDate().toString().padStart(2,'0');
    fechaYmd = `${yyyy}-${mm}-${dd}`;
  } else if (lower.includes('hoy')) {
    const d = new Date(now.getTime());
    const yyyy = d.getFullYear();
    const mm = (d.getMonth()+1).toString().padStart(2,'0');
    const dd = d.getDate().toString().padStart(2,'0');
    fechaYmd = `${yyyy}-${mm}-${dd}`;
  }

  let tema = null;
  if (lower.includes('kilos')) tema = 'kilos';
  else if (lower.includes('chofer') || lower.includes('conductor')) tema = 'chofer';
  else if (lower.includes('vida util') || lower.includes('vida útil')) tema = 'vida_util';
  else if (lower.includes('dekra')) tema = 'dekra';
  else if (lower.includes('quick pass') || lower.includes('quickpass')) tema = 'quick pass';
  else if (lower.includes('proveedur')) tema = 'proveeduría';

  return { placa, fechaYmd, tema, raw: lower };
}

module.exports = {
  extractPlaca,
  extractReminderParts,
  extractAgendaRangeForQuery,
  extractInfoQuery,
};
