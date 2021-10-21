const uniqBy = require('lodash/uniqBy');
const { Scenes } = require('telegraf');
const checkLink = require('../checkLink');
const linksArrayToMessage = require('../linksArrayToMessage');
const { cancelMenu, mainMenuButtons } = require('../menus');
const sendMessage = require('../sendMessage');
const { isUrlValid } = require('../utils');

const newLinkWizard = new Scenes.WizardScene(
  'ADD_LINK',
  {
    enterHandlers: [
      (ctx) => {
        ctx.reply(
          'Please insert page which should to be checked? Or a list of pages splitted by comma or new line',
          cancelMenu,
        );
      },
    ],
  },

  (ctx) => {
    if (ctx.message.text === 'Cancel') {
      ctx.scene.leave();
      return ctx.reply('You now in main menu', mainMenuButtons(ctx));
    }
    ctx.wizard.state.data = {};

    const msg = ctx.message.text;

    const splittedByComa = msg.split(',').map((el) => el.trim());
    const splittedByNewLine = msg.split('\n').map((el) => el.trim());

    if (
      !(
        (msg.includes(',') && splittedByComa.every(isUrlValid)) ||
        (msg.includes('\n') && splittedByNewLine.every(isUrlValid)) ||
        isUrlValid(msg)
      )
    ) {
      ctx.reply('Please enter a valid url', cancelMenu);
      return;
    }

    if (msg.includes(',')) {
      ctx.wizard.state.data.links = splittedByComa.map((el) => ({ page: el }));
    } else if (msg.includes('\n')) {
      ctx.wizard.state.data.links = splittedByNewLine.map((el) => ({ page: el }));
    } else if (isUrlValid(msg)) {
      ctx.wizard.state.data.links = [{ page: ctx.message.text }];
    }

    ctx.reply('Enter domain which should be on this pages', cancelMenu);
    return ctx.wizard.next();
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

    ctx.wizard.state.data.links = ctx.wizard.state.data.links.map((el) => ({
      ...el,
      link: ctx.message.text,
    }));

    ctx.reply('Checking new link(s)', cancelMenu);
    const checkedLinks = await Promise.all(ctx.wizard.state.data.links.map(checkLink));
    const tableStr = linksArrayToMessage(checkedLinks);
    await sendMessage(ctx.reply.bind(ctx), tableStr, { disable_web_page_preview: true });

    if (!ctx.session.links) {
      ctx.session.links = [];
    }
    ctx.session.links = uniqBy([...ctx.session.links, ...checkedLinks], (el) => el.page + el.link);
    ctx.reply(`Thank you for your replies, link added to your list`, mainMenuButtons(ctx));
    return ctx.scene.leave();
  },
);

module.exports = newLinkWizard;
