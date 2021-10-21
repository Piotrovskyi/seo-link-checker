const { BOT_TOKEN } = process.env;
const { Telegraf } = require('telegraf');
const bot = new Telegraf(BOT_TOKEN, { webhookReply: true });

module.exports = bot;
