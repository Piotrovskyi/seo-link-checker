const { Scenes } = require('telegraf');
const { mainMenuButtons, cancelMenu } = require('../menus');
const { isUrlValid } = require('../utils');

const removeLinkWizard = new Scenes.WizardScene(
  'REMOVE_LINK',
  {
    enterHandlers: [
      (ctx) => {
        ctx.reply('Please insert page which we should delete?', cancelMenu);
      },
    ],
  },

  async (ctx) => {
    if (ctx.message.text === 'Cancel') {
      ctx.scene.leave();
      return ctx.reply('You now in main menu', mainMenuButtons(ctx));
    }
    if (!isUrlValid(ctx.message.text)) {
      ctx.reply('Please enter a valid url', cancelMenu);
      return;
    }

    if (!ctx.session.links) {
      ctx.session.links = [];
    }
    ctx.session.links = ctx.session.links.filter((old) => old.page !== ctx.message.text);

    ctx.reply(`link removed`, mainMenuButtons(ctx));
    return ctx.scene.leave();
  },
);

module.exports = removeLinkWizard;
