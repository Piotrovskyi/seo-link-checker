const { Markup } = require("telegraf");

const add = "➕ Add new link";
const list = `🗄️ My links`;
const remove = "❌ Remove link";
const check = "🧐 Check my links";

const mainMenuButtons = (ctx) =>
  Markup.keyboard([
    [add, list],
    [remove, check],
  ]).resize();

const cancelMenu = Markup.keyboard([["Cancel"]]).resize();

module.exports = { mainMenuButtons, cancelMenu, add, list, remove, check };
