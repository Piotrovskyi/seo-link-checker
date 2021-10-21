'use strict';

// eslint-disable-next-line no-undef
const { NODE_ENV } = process.env;
const { Telegraf, Scenes } = require('telegraf');
// const bot = new Telegraf(BOT_TOKEN, { webhookReply: true });
const { session } = require('telegraf-session-mongodb');
const bot = require('./src/bot.js');
const checkLink = require('./src/checkLink.js');
const sendMessage = require('./src/sendMessage.js');

const getDBConnection = require('./src/dbConnection.js');
const linksArrayToMessage = require('./src/linksArrayToMessage.js');
const newLinkWizard = require('./src/scenes/addLink.js');
const removeLinkWizard = require('./src/scenes/removeLink.js');
const { mainMenuButtons } = require('./src/menus.js');

const stage = new Scenes.Stage([newLinkWizard, removeLinkWizard]);

async function main() {
  // connect to db
  // if (NODE_ENV !== 'production') {
  bot.use(Telegraf.log());
  // }

  const db = await getDBConnection();

  bot.use(session(db, { collectionName: 'sessions' }));
  console.log('db connected');

  bot.use(stage.middleware());
  bot.hears('Cancel', (ctx) => {
    ctx.scene.leave();
    return ctx.reply('You now in main menu', mainMenuButtons(ctx));
  });

  bot.start((ctx) => {
    return ctx.reply(
      'Welcome to link checker bot. Please add links which you want to check one by one',
      mainMenuButtons(ctx),
    );
  });

  bot.hears('Add new link', (ctx) => ctx.scene.enter('ADD_LINK'));
  bot.hears('My links', (ctx) => {
    if (!ctx.session.links || !ctx.session.links.length) {
      return ctx.reply(`You don't have any links yet`);
    }
    const tableStr = linksArrayToMessage(ctx.session.links);
    sendMessage(ctx.reply.bind(ctx), tableStr, { disable_web_page_preview: true });
  });
  bot.hears('Remove link', (ctx) => ctx.scene.enter('REMOVE_LINK'));
  bot.hears('Check my links', async (ctx) => {
    if (!ctx.session.links || !ctx.session.links.length) {
      return ctx.reply(`You don't have any links yet`);
    }

    const checkedLinks = await Promise.all(ctx.session.links.map(checkLink));
    ctx.session.links = checkedLinks;
    ctx.reply(ctx.session.links.every((link) => link.valid) ? 'All ok' : 'Not ok, check list');

    const tableStr = linksArrayToMessage(checkedLinks);
    sendMessage(ctx.reply.bind(ctx), tableStr, { disable_web_page_preview: true });
  });
}

// bot.telegram.sendMessage()

// connect to labmda
if (NODE_ENV === 'production') {
  // bot.telegram.setWebhook(process.env.URL).then(() => {
  //   console.log('webhook added');
  // });

  module.exports.linkCheckerBot = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    const body = JSON.parse(event.body);
    await main();
    await bot.handleUpdate(body);
    const response = {
      statusCode: 200,
      body: '',
    };

    return callback(null, response);
  };
} else {
  main().then(() => {
    bot.launch();
  });
}
