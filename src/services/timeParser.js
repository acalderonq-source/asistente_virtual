// src/services/timeParser.js

function pad2(n) {
  return String(n).padStart(2, '0');
}

const dayMap = {
  'domingo': 0,
  'lunes': 1,
  'martes': 2,
  'miercoles': 3,
  'miércoles': 3,
  'jueves': 4,
  'viernes': 5,
  'sabado': 6,
  'sábado': 6,
};

function findNamedDay(rawMsg) {
  const lower = (rawMsg || '').toLowerCase();
  for (const [name, num] of Object.entries(dayMap)) {
    if (lower.includes(name)) return { name, dayNum: num };
  }
  return null;
}

function resolveNamedDayToDate(named, now) {
  const base = new Date(now.getTime());
  const todayNum = base.getDay(); // 0=domingo
  let diff = named.dayNum - todayNum;
  if (diff < 0) diff += 7;
  const target = new Date(base.getTime());
  target.setDate(base.getDate() + diff);
  return target;
}

function parseHourFromText(rawMsg) {
  const lower = (rawMsg || '').toLowerCase();
  const match = lower.match(/a las?\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (!match) {
    // por defecto 09:00 si no se especifica
    return { hour: 9, minute: 0, raw: '' };
  }
  let hour = parseInt(match[1], 10);
  let minute = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3];
  if (ampm === 'pm' && hour < 12) hour += 12;
  if (ampm === 'am' && hour === 12) hour = 0;
  return { hour, minute, raw: match[0] };
}

function buildDateTimeString(dateObj, hour, minute) {
  const yyyy = dateObj.getFullYear();
  const mm = pad2(dateObj.getMonth() + 1);
  const dd = pad2(dateObj.getDate());
  const HH = pad2(hour);
  const MM = pad2(minute);
  const SS = '00';
  return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`; // con segundos
}

// "mañana", "hoy", "YYYY-MM-DD HH:MM"
function parseExplicitOrRelative(rawMsg, now) {
  const lower = (rawMsg || '').toLowerCase();

  // explícito: "2025-10-30 14:00" (segundos opcionales; normalizamos luego)
  const explicit = lower.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})(?::\d{2})?/);
  if (explicit) {
    const fechaStr = `${explicit[1]} ${explicit[2]}:00`;
    return { mode: 'explicit', fechaStr, consumedWord: '', consumedHourWord: '' };
  }

  let base = new Date(now.getTime());
  let consumedWord = '';
  if (lower.includes('mañana') || lower.includes('manana')) {
    base.setDate(base.getDate() + 1);
    consumedWord = 'mañana';
  } else if (lower.includes('hoy')) {
    consumedWord = 'hoy';
  } else {
    return { mode: null, fechaStr: null, consumedWord: '', consumedHourWord: '' };
  }

  const { hour, minute, raw: hourRaw } = parseHourFromText(rawMsg);
  base.setHours(hour, minute, 0, 0);

  return {
    mode: 'relative',
    fechaStr: buildDateTimeString(base, base.getHours(), base.getMinutes()),
    consumedWord,
    consumedHourWord: hourRaw
  };
}

function extractAgendaRange(rawMsg, now) {
  const lower = (rawMsg || '').toLowerCase();
  let start, end;

  if (lower.includes('este mes')) {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (lower.includes('esta semana')) {
    const day = now.getDay(); // domingo=0
    start = new Date(now);
    start.setDate(now.getDate() - day);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
  } else if (lower.includes('hoy')) {
    start = new Date(now);
    end   = new Date(now);
  } else if (lower.includes('mañana') || lower.includes('manana')) {
    start = new Date(now);
    start.setDate(now.getDate() + 1);
    end = new Date(start);
  } else {
    const named = findNamedDay(rawMsg);
    if (named) {
      const d = resolveNamedDayToDate(named, now);
      start = d; end = d;
    }
  }

  if (!start) { start = new Date(now); end = new Date(now); }

  const y1 = start.getFullYear();
  const m1 = pad2(start.getMonth() + 1);
  const d1 = pad2(start.getDate());
  const y2 = end.getFullYear();
  const m2 = pad2(end.getMonth() + 1);
  const d2 = pad2(end.getDate());

  return { startYMD: `${y1}-${m1}-${d1}`, endYMD: `${y2}-${m2}-${d2}` };
}

// "miercoles tengo reunion ... a las 9am" -> fecha + texto
function parseReminderNatural(rawMsg, now) {
  const named = findNamedDay(rawMsg);
  const { hour, minute, raw: hourChunk } = parseHourFromText(rawMsg);
  let targetDate;

  if (named) {
    targetDate = resolveNamedDayToDate(named, now);
  } else {
    targetDate = new Date(now.getTime());
  }

  targetDate.setHours(hour, minute, 0, 0);

  const fechaStr = buildDateTimeString(
    targetDate,
    targetDate.getHours(),
    targetDate.getMinutes()
  );

  let textoRecordatorio = (rawMsg || '')
    .replace(hourChunk, '')
    .replace(/tengo/gi, '')
    .replace(/a las/gi, '')
    .replace(/hoy|mañana|manana|lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo/gi, '')
    .trim();

  if (!textoRecordatorio) textoRecordatorio = 'Recordatorio';

  return { fechaStr, textoRecordatorio };
}

module.exports = {
  pad2,
  findNamedDay,
  resolveNamedDayToDate,
  parseHourFromText,
  buildDateTimeString,
  parseExplicitOrRelative,
  extractAgendaRange,
  parseReminderNatural,
};
