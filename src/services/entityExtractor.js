// src/services/entityExtractor.js

const {
  parseExplicitOrRelative,
  parseReminderNatural,
  extractAgendaRange,
} = require('./timeParser');

// Extrae una placa tipo "170900" (5-6 dígitos)
function extractPlaca(rawMsg) {
  const m = (rawMsg || '').match(/\b\d{5,6}\b/);
  return m ? m[0] : null;
}

/**
 * Convierte frases naturales en fecha+texto para recordatorios.
 * Prioriza "mañana"/"hoy" (parser relativo) y luego día de semana.
 * Devuelve { fechaStr: "YYYY-MM-DD HH:MM", texto: "..." }
 */
function extractReminderParts(rawMsg, now) {
  const lower = (rawMsg || '').toLowerCase();
  let fechaStr = null;
  let textoRecordatorio = null;

  // 1) Priorizar relativo si menciona "mañana"/"hoy"
  if (lower.includes('mañana') || lower.includes('manana') || lower.includes('hoy')) {
    const rel = parseExplicitOrRelative(rawMsg, now);
    if (rel && rel.fechaStr) {
      fechaStr = rel.fechaStr;

      // Limpiar verbos de agendado y las palabras consumidas por el parser relativo
      textoRecordatorio = (rawMsg || '')
        .replace(rel.consumedWord || '', '')
        .replace(rel.consumedHourWord || '', '')
        .replace(
          /^(agenda|agend(a|á|ame|ar)|program(a|ar|ame)|pon(e|eme)\s+(un\s+)?recordatorio|recorda(me)?|recordame|haceme\s+un\s+recordatorio|crea(me)?\s+un\s+recordatorio|poneme\s+alarma)\s*/i,
          ''
        )
        .trim() || 'Recordatorio';
    }
  }

  // 2) Si no quedó resuelto, usar parser natural por día de semana/estructura general
  if (!fechaStr) {
    const nat = parseReminderNatural(rawMsg, now);
    fechaStr = nat.fechaStr;
    textoRecordatorio = nat.textoRecordatorio;
  }

  // 3) Fallbacks de seguridad
  if (!fechaStr) {
    const fallbackDate = new Date(now.getTime() + 10 * 60 * 1000); // +10 min
    const yyyy = fallbackDate.getFullYear();
    const mm = String(fallbackDate.getMonth() + 1).padStart(2, '0');
    const dd = String(fallbackDate.getDate()).padStart(2, '0');
    const HH = String(fallbackDate.getHours()).padStart(2, '0');
    const MM = String(fallbackDate.getMinutes()).padStart(2, '0');
    fechaStr = `${yyyy}-${mm}-${dd} ${HH}:${MM}`;
  }
  if (!textoRecordatorio) textoRecordatorio = 'Recordatorio';

  return { fechaStr, texto: textoRecordatorio };
}

/**
 * Rango para consultas de agenda (hoy, mañana, sábado, esta semana, este mes).
 * Devuelve { startYMD: "YYYY-MM-DD", endYMD: "YYYY-MM-DD" }
 */
function extractAgendaRangeForQuery(rawMsg, now) {
  return extractAgendaRange(rawMsg, now);
}

/**
 * Arma parámetros de búsqueda operativa:
 * - placa (5-6 dígitos)
 * - fechaYmd (si dice hoy/ayer)
 * - tema ("kilos", "chofer", "vida_util", "dekra", "quick pass", "proveeduría")
 * - raw (mensaje en minúsculas)
 */
function extractInfoQuery(rawMsg, now) {
  const lower = (rawMsg || '').toLowerCase();
  const placa = extractPlaca(rawMsg);

  // fecha: hoy / ayer
  let fechaYmd = null;
  if (lower.includes('ayer')) {
    const d = new Date(now.getTime());
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    fechaYmd = `${yyyy}-${mm}-${dd}`;
  } else if (lower.includes('hoy')) {
    const d = new Date(now.getTime());
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    fechaYmd = `${yyyy}-${mm}-${dd}`;
  }

  // tema
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
