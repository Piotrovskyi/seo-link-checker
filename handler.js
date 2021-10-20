'use strict';

const { BOT_TOKEN, NODE_ENV, MONGODB_URI } = process.env;
const { Telegraf, Scenes, Markup } = require('telegraf');
const bot = new Telegraf(BOT_TOKEN, { webhookReply: true });
const { session } = require('telegraf-session-mongodb');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const cheerio = require('cheerio');
const { DateTime } = require('luxon');

async function checkLink(data) {
  try {
    console.log('start request', data);
    const res = await axios(data.page);
    console.log('page data received', data);
    const $ = cheerio.load(res.data);
    const links = $('a');

    let domainLinks = [];

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      // const href = link.attribs.href;
      if (link.attribs.href && link.attribs.href.includes(data.link)) {
        domainLinks.push({
          // valid: true,
          attrs: link.attribs,
          url: link.attribs.href,
        });
      }
    }

    return { ...data, valid: !!domainLinks.length, checked: new Date().toISOString() };
  } catch (err) {
    console.log('here');
    console.log(err);
    return { ...data, valid: false };
  }
}

function isUrlValid(userInput) {
  var res = userInput.match(
    /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g,
  );
  console.log({ res });
  if (res == null) return false;
  else return true;
}

let dbObject = null;
const getDBConnection = async () => {
  if (dbObject && dbObject.serverConfig.isConnected()) return dbObject;

  const client = await MongoClient.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  dbObject = client.db();
  return dbObject;
};

const newLinkWizard = new Scenes.WizardScene(
  'ADD_LINK',
  {
    enterHandlers: [
      (ctx) => {
        ctx.reply('Please insert link which should to be checked?');
      },
    ],
  },

  (ctx) => {
    ctx.wizard.state.data = {};

    if (!isUrlValid(ctx.message.text)) {
      ctx.reply('Please enter a valid url');
      return;
    }

    ctx.wizard.state.data.link = ctx.message.text;
    ctx.reply('Enter page where you want to check this link');
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!isUrlValid(ctx.message.text)) {
      ctx.reply('Please enter a valid url');
      return;
    }

    ctx.wizard.state.data.page = ctx.message.text;
    if (!ctx.session.links) {
      ctx.session.links = [];
    }
    ctx.session.links.push(ctx.wizard.state.data);
    ctx.reply(`Thank you for your replies, link added to be checked`);
    return ctx.scene.leave();
  },
);

const removeLinkWizard = new Scenes.WizardScene(
  'REMOVE_LINK',
  {
    enterHandlers: [
      (ctx) => {
        ctx.reply('Please insert link which we should delete?');
      },
    ],
  },

  async (ctx) => {
    if (!isUrlValid(ctx.message.text)) {
      ctx.reply('Please enter a valid url');
      return;
    }

    if (!ctx.session.links) {
      ctx.session.links = [];
    }
    ctx.session.links = ctx.session.links.filter((old) => old.link !== ctx.message.text);

    ctx.reply(`link removed`);
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

  bot.start((ctx) => {
    return ctx.reply(
      'Welcome to link checker bot. Please add links which you want to check one by one',
      Markup.keyboard([['Add new link', 'My links', 'Remove link', 'Check my links']]).resize(),
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
  bot.hears('Check my links', async (ctx) => {
    if (!ctx.session.links || !ctx.session.links.length) {
      return ctx.reply(`You don't have any links yet`);
    }

    const checkedLinks = await Promise.all(ctx.session.links.map(checkLink));
    ctx.session.links = checkedLinks;
    ctx.reply(ctx.session.links.every((link) => link.valid) ? 'All ok' : 'Not ok, check list');

    const tableStr = checkedLinks
      .map((row) => {
        const data = {
          page: row.page,
          link: row.link,
          valid: row.valid,
          lastChecked: DateTime.fromISO(row.checked).toLocaleString(DateTime.DATETIME_FULL),
        };
        return Object.keys(data)
          .map((key) => (data[key] ? `${key}: ${data[key]}` : ''))
          .filter((e) => e)
          .join('\n');
      })
      .join('\n\n');
    ctx.reply(tableStr, { disable_web_page_preview: true });
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
