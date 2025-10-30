const { Telegraf } = require('telegraf');
const { handleUserMessage } = require('./messageBrain');
const reminderService = require('./reminderService');

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const allowedChatIds = (process.env.TELEGRAM_CHAT_IDS || process.env.TELEGRAM_CHAT_ID || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

let bot = null;
let started = false;

async function notify(text) {
  if (!bot || !allowedChatIds.length) {
    console.warn('Telegram no configurado o sin chats. Mensaje sería:', text);
    return;
  }
  for (const chatId of allowedChatIds) {
    try {
      await bot.telegram.sendMessage(chatId, text);
    } catch (err) {
      console.error('Error enviando a', chatId, err.message);
    }
  }
}

async function startListener() {
  if (!botToken) {
    console.warn('Sin TELEGRAM_BOT_TOKEN.');
    return;
  }
  if (started) return;
  started = true;

  bot = new Telegraf(botToken);

  bot.on('text', async (ctx) => {
    const fromChat = ctx.chat.id.toString();
    if (allowedChatIds.length && !allowedChatIds.includes(fromChat)) {
      return ctx.reply('No estoy autorizado para este chat.');
    }

    try {
      const rawMsg = ctx.message.text || '';
      const respuesta = await handleUserMessage(rawMsg);
      return ctx.reply(respuesta);
    } catch (err) {
      console.error('Error procesando mensaje:', err);
      return ctx.reply(`Hubo un problema procesando eso: ${err.message}`);
    }
  });

  try {
    await bot.launch();
  } catch (err) {
    if (err?.response?.error_code === 409) {
      console.warn('Otra instancia ya está haciendo polling. Esta no lanza.');
      return;
    }
    throw err;
  }

  process.once('SIGINT',  () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

module.exports = { notify, startListener };
