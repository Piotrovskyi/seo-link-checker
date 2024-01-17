// eslint-disable-next-line no-undef
const { BOT_TOKEN } = process.env;
const { Telegraf } = require("telegraf");
const bot = new Telegraf(BOT_TOKEN);

module.exports = bot;
