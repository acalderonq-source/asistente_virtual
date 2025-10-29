function smallTalk(preguntaLower) {
  // saludos
  if (
    preguntaLower === 'hola' ||
    preguntaLower === 'hola.' ||
    preguntaLower === 'buenas' ||
    preguntaLower.startsWith('buenos dias') ||
    preguntaLower.startsWith('buenas tardes') ||
    preguntaLower.startsWith('buenas noches')
  ) {
    return "Hola 👋. Te escucho.";
  }

  // confirmaciones
  if (
    preguntaLower === 'claro' ||
    preguntaLower === 'ok' ||
    preguntaLower === 'si' ||
    preguntaLower === 'sí' ||
    preguntaLower === 'dale'
  ) {
    return "Perfecto 👍";
  }

  // agradecimiento
  if (
    preguntaLower.includes('gracias') ||
    preguntaLower.includes('pura vida') ||
    preguntaLower.includes('te agradezco')
  ) {
    return "Pura vida 😎";
  }

  // chiste
  if (preguntaLower.includes('contame un chiste')) {
    return "Ok, uno rápido: ¿Por qué el camión no se queja? Porque ya está 'cargado' de problemas 😅";
  }

  return null;
}

// Explicaciones internas rápidas tipo "qué es dekra", "qué es quick pass"
function knowledgeBaseInterna(preguntaLower) {
  if (preguntaLower.includes("quick pass") || preguntaLower.includes("quickpass")) {
    return (
      "Quick Pass se usa para gestionar acceso/permiso rápido del camión/chofer. " +
      "Si alguien dice 'pasame el Quick Pass de Cristian', es confirmar que está habilitado antes de salir."
    );
  }
  if (preguntaLower.includes("dekra")) {
    return (
      "Dekra = inspección técnica. Llevás cisterna/camión limpio y listo. Normalmente preguntan 'qué dijo Dekra' para saber si aprobó o pidió corrección."
    );
  }
  if (preguntaLower.includes("ruta") && preguntaLower.includes("apta")) {
    return (
      "Para ver si una unidad puede salir a ruta revisamos vida útil %, falla grave y estado general. Si vida útil está baja o hay falla grave ⇒ NO APTA."
    );
  }
  if (preguntaLower.includes("agenda") || preguntaLower.includes("pendiente")) {
    return (
      "Tu agenda la guardo como recordatorios con fecha/hora. Te puedo decir qué hay hoy, mañana, sábado, este mes; y también puedo crear nuevos."
    );
  }
  return null;
}

function intentarExplicarTema(preguntaLower) {
  const arrancaConsulta =
    preguntaLower.startsWith("que es ") ||
    preguntaLower.startsWith("qué es ") ||
    preguntaLower.startsWith("explicame ") ||
    preguntaLower.startsWith("explícame ") ||
    preguntaLower.includes("para que sirve") ||
    preguntaLower.includes("para qué sirve");

  if (!arrancaConsulta) return null;

  const kb = knowledgeBaseInterna(preguntaLower);
  if (kb) {
    return kb + "\n¿Querés que lo agende?";
  } else {
    return (
      "No tengo info interna guardada de eso todavía, " +
      "pero puedo agendarlo para que no se te olvide."
    );
  }
}

// Redacción formal: "avisale a Gabriela que vamos tarde con dekra"
function generarRedaccion(destinatario, ideaBase) {
  const limpio = ideaBase.trim();
  const frase = limpio.charAt(0).toUpperCase() + limpio.slice(1);
  return (
    `Buenos días ${destinatario},\n\n` +
    `${frase}.\n\n` +
    `Quedo atento.\n`
  );
}

function intentarGenerarRedaccion(preguntaLower, original) {
  // avisale / decile a X que ...
  const match = preguntaLower.match(/(mensaje|avisale|decile)\s+(a\s+)?([a-záéíóúñ]+)\s+(que|diciendo que)\s+(.*)/i);
  if (match) {
    const destinatario = match[3];
    const ideaBase = match[5];
    const texto = generarRedaccion(destinatario, ideaBase);
    return (
      "Te propongo este texto:\n\n" +
      texto +
      "\n¿Querés que lo usemos como recordatorio?"
    );
  }

  // correo para X sobre Y
  const match2 = preguntaLower.match(/(correo|mensaje)\s+(para)\s+([a-záéíóúñ]+)\s+(sobre|diciendo|por)\s+(.*)/i);
  if (match2) {
    const destinatario = match2[3];
    const ideaBase = match2[5];
    const texto = generarRedaccion(destinatario, ideaBase);
    return (
      "Podés enviar algo así:\n\n" +
      texto +
      "\n¿Lo querés agendar?"
    );
  }

  return null;
}

// Fallback final
async function askAssistant(preguntaRaw) {
  const preguntaLower = (preguntaRaw || "").toLowerCase();

  const st = smallTalk(preguntaLower);
  if (st) return st;

  const kbAnswer = intentarExplicarTema(preguntaLower);
  if (kbAnswer) return kbAnswer;

  const draft = intentarGenerarRedaccion(preguntaLower, preguntaRaw);
  if (draft) return draft;

  // respuesta corta, sin el bloque largo
  return "Listo 👍";
}

module.exports = { askAssistant };
