const { Markup } = require('telegraf');

const mainMenuButtons = (ctx) =>
  Markup.keyboard([
    [
      'Add new link',
      `My links`, //(${ctx.session.links ? ctx.session.links.length : '0'})
      'Remove link',
      'Check my links',
    ],
  ]).resize();
const cancelMenu = Markup.keyboard([['Cancel']]).resize();

module.exports = { mainMenuButtons, cancelMenu };
