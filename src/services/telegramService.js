const { Telegraf } = require('telegraf');
const { handleUserMessage } = require('./messageBrain');
const reminderService = require('./reminderService');

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const allowedChatId = process.env.TELEGRAM_CHAT_ID;

let bot = null;
let started = false; // <-- evita doble launch

async function notify(text) {
  if (!bot || !allowedChatId) {
    console.warn('Telegram no configurado. Mensaje sería:', text);
    return;
  }
  try {
    await bot.telegram.sendMessage(allowedChatId, text);
  } catch (err) {
    console.error('Error enviando Telegram:', err.message);
  }
}

async function handleQuickReplies(userMsg) {
  const msg = (userMsg || '').toLowerCase().trim();

  // eliminar por id o texto
  if (msg.startsWith('elimina') || msg.startsWith('eliminar') || msg.startsWith('borra') || msg.startsWith('borrar')) {
    const idMatch = msg.match(/(\d+)/);
    if (idMatch) {
      await reminderService.deleteReminderById(idMatch[1]);
      return `Listo. Eliminé el recordatorio #${idMatch[1]}.`;
    }
    const fragment = msg.split(' ').slice(1).join(' ').trim();
    if (!fragment) return 'Decime qué recordatorio querés borrar.';
    const found = await reminderService.findReminderByTextFragment(fragment);
    if (!found) return 'No encontré nada con esa descripción.';
    await reminderService.deleteReminderById(found.id);
    return `Listo. Eliminé el recordatorio #${found.id} (${found.mensaje}).`;
  }

  // si / no
  if (['si','sí','ya','listo','hecho'].includes(msg)) {
    const last = await reminderService.getLastSentNotAnswered();
    if (!last) return 'No tengo nada pendiente para marcar como hecho.';
    await reminderService.markAsCompleted(last.id);
    return `Perfecto ✅ Quedó marcado como realizado (#${last.id}: ${last.mensaje}).`;
  }
  if (['no','todavia','todavía','aun','aún'].includes(msg)) {
    const last = await reminderService.getLastSentNotAnswered();
    if (!last) return 'No tengo nada pendiente para marcar como NO hecho.';
    await reminderService.markAsNotCompleted(last.id);
    return `Ok, lo dejo pendiente (#${last.id}: ${last.mensaje}).`;
  }

  return null;
}

async function startListener() {
  if (!botToken) {
    console.warn('Sin TELEGRAM_BOT_TOKEN.');
    return;
  }
  if (started) {
    console.warn('Listener Telegram ya iniciado. (ignorado)');
    return;
  }
  started = true;

  bot = new Telegraf(botToken);

  bot.on('text', async (ctx) => {
    const fromChat = ctx.chat.id.toString();
    const rawMsg = ctx.message.text || '';

    if (allowedChatId && fromChat !== allowedChatId) {
      return ctx.reply('No estoy autorizado para este chat.');
    }
    try {
      const quick = await handleQuickReplies(rawMsg);
      if (quick) return ctx.reply(quick);

      const respuesta = await handleUserMessage(rawMsg);
      return ctx.reply(respuesta);
    } catch (err) {
      console.error('Error procesando mensaje:', err);
      return ctx.reply(`Hubo un problema procesando eso: ${err.message}`);
    }
  });

  // Lanzar polling con manejo explícito del 409 (otra instancia)
  try {
    await bot.launch();
  } catch (err) {
    if (err?.response?.error_code === 409) {
      console.warn('Otro proceso ya está haciendo polling. Esta instancia NO lanzará bot.launch().');
      return; // no re-lanzar, mantené el servidor vivo
    }
    throw err; // otros errores sí deben salir
  }

  process.once('SIGINT',  () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

module.exports = { notify, startListener };
