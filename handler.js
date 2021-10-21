'use strict';

const { BOT_TOKEN, NODE_ENV } = process.env;
const { Telegraf, Scenes, Markup } = require('telegraf');
// const bot = new Telegraf(BOT_TOKEN, { webhookReply: true });
const { session } = require('telegraf-session-mongodb');
const bot = require('./src/bot.js');

const { DateTime } = require('luxon');
const getDBConnection = require('./src/dbConnection.js');
const uniqBy = require('lodash/uniqBy');

function isUrlValid(userInput) {
  var res = userInput.match(
    /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g,
  );

  if (res == null) return false;
  else return true;
}

const mainMenuButtons = Markup.keyboard([['Add new link', 'My links', 'Remove link']]).resize();
const cancelMenu = Markup.keyboard([['Cancel']]).resize();

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
      return ctx.reply('You now in main menu', mainMenuButtons);
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
      return ctx.reply('You now in main menu', mainMenuButtons);
    }
    if (!isUrlValid(ctx.message.text)) {
      ctx.reply('Please enter a valid url', cancelMenu);
      return;
    }

    ctx.wizard.state.data.links = ctx.wizard.state.data.links.map((el) => ({
      ...el,
      link: ctx.message.text,
    }));

    if (!ctx.session.links) {
      ctx.session.links = [];
    }
    ctx.session.links = uniqBy(
      [...ctx.session.links, ...ctx.wizard.state.data.links],
      (el) => el.page + el.link,
    );
    ctx.reply(`Thank you for your replies, link added to be checked`, mainMenuButtons);
    return ctx.scene.leave();
  },
);

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
      return ctx.reply('You now in main menu', mainMenuButtons);
    }
    if (!isUrlValid(ctx.message.text)) {
      ctx.reply('Please enter a valid url', cancelMenu);
      return;
    }

    if (!ctx.session.links) {
      ctx.session.links = [];
    }
    ctx.session.links = ctx.session.links.filter((old) => old.page !== ctx.message.text);

    ctx.reply(`link removed`, mainMenuButtons);
    return ctx.scene.leave();
  },
);

const stage = new Scenes.Stage([newLinkWizard, removeLinkWizard]);

async function main() {
  // connect to db
  if (NODE_ENV !== 'production') {
    bot.use(Telegraf.log());
  }

  const db = await getDBConnection();

  bot.use(session(db, { collectionName: 'sessions' }));
  console.log('db connected');

  bot.use(stage.middleware());
  bot.hears('Cancel', (ctx) => {
    ctx.scene.leave();
    return ctx.reply('You now in main menu', mainMenuButtons);
  });

  bot.start((ctx) => {
    return ctx.reply(
      'Welcome to link checker bot. Please add links which you want to check one by one',
      mainMenuButtons,
    );
  });

  bot.hears('Add new link', (ctx) => ctx.scene.enter('ADD_LINK'));
  bot.hears('My links', (ctx) => {
    if (!ctx.session.links || !ctx.session.links.length) {
      return ctx.reply(`You don't have any links yet`);
    }
    const tableStr = ctx.session.links
      .map((row) => {
        const data = {
          page: row.page,
          link: row.link,
          valid: row.valid,
          lastChecked: row.checked
            ? DateTime.fromISO(row.checked).toLocaleString(DateTime.DATETIME_FULL)
            : null,
        };
        return Object.keys(data)
          .map((key) => (data[key] ? `${key}: ${data[key]}` : ''))
          .filter((e) => e)
          .join('\n');
      })
      .join('\n\n');
    ctx.reply(tableStr, { disable_web_page_preview: true });
  });
  bot.hears('Remove link', (ctx) => ctx.scene.enter('REMOVE_LINK'));
  // bot.hears('Check my links', async (ctx) => {
  //   if (!ctx.session.links || !ctx.session.links.length) {
  //     return ctx.reply(`You don't have any links yet`);
  //   }

  //   const checkedLinks = await Promise.all(ctx.session.links.map(checkLink));
  //   ctx.session.links = checkedLinks;
  //   ctx.reply(ctx.session.links.every((link) => link.valid) ? 'All ok' : 'Not ok, check list');

  //   const tableStr = checkedLinks
  //     .map((row) => {
  //       const data = {
  //         page: row.page,
  //         link: row.link,
  //         valid: row.valid,
  //         lastChecked: DateTime.fromISO(row.checked).toLocaleString(DateTime.DATETIME_FULL),
  //       };
  //       return Object.keys(data)
  //         .map((key) => (data[key] ? `${key}: ${data[key]}` : ''))
  //         .filter((e) => e)
  //         .join('\n');
  //     })
  //     .join('\n\n');
  //   ctx.reply(tableStr, { disable_web_page_preview: true });
  // });
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
