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
const {
  parseExplicitOrRelative,
  parseReminderNatural,
  extractAgendaRange,
} = require('./timeParser');

const {
  parseExplicitOrRelative,
  parseReminderNatural,
  extractAgendaRange,
} = require('./timeParser');

function extractReminderParts(rawMsg, now) {
  const lower = rawMsg.toLowerCase();
  let fechaStr = null;
  let textoRecordatorio = null;

  // Si menciona "mañana"/"hoy", priorizar parser relativo
  if (lower.includes('mañana') || lower.includes('manana') || lower.includes('hoy')) {
    const rel = parseExplicitOrRelative(rawMsg, now);
    if (rel && rel.fechaStr) {
      fechaStr = rel.fechaStr;
      textoRecordatorio = rawMsg
        .replace(rel.consumedWord || '', '')
        .replace(rel.consumedHourWord || '', '')
        .replace(/^(agenda|agend(a|á|ame|ar)|program(a|ar|ame)|pon(e|eme)\s+(un\s+)?recordatorio|recorda(me)?|recordame|haceme\s+un\s+recordatorio|crea(me)?\s+un\s+recordatorio|poneme\s+alarma)\s*/i, '')
        .trim() || 'Recordatorio';
    }
  }

  // Si no se resolvió arriba, probar el parser por día de semana
  if (!fechaStr) {
    const nat = parseReminderNatural(rawMsg, now);
    fechaStr = nat.fechaStr;
    textoRecordatorio = nat.textoRecordatorio;
  }

  // Fallbacks
  if (!fechaStr) {
    const fallbackDate = new Date(now.getTime() + 10 * 60 * 1000);
    const yyyy = fallbackDate.getFullYear();
    const mm = (fallbackDate.getMonth() + 1).toString().padStart(2, '0');
    const dd = fallbackDate.getDate().toString().padStart(2, '0');
    const HH = fallbackDate.getHours().toString().padStart(2, '0');
    const MM = fallbackDate.getMinutes().toString().padStart(2, '0');
    fechaStr = `${yyyy}-${mm}-${dd} ${HH}:${MM}`;
  }
  if (!textoRecordatorio) textoRecordatorio = 'Recordatorio';

  return { fechaStr, texto: textoRecordatorio };
}

module.exports = {
  extractPlaca,
  extractReminderParts,
  extractAgendaRangeForQuery,
  extractInfoQuery,
};
