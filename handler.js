'use strict';

const { BOT_TOKEN, NODE_ENV, MONGODB_URI } = process.env;
const { Telegraf } = require('telegraf');
const bot = new Telegraf(BOT_TOKEN);
const { session } = require('telegraf-session-mongodb');
const { MongoClient } = require('mongodb');

async function main() {
  await MongoClient.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((client) => {
      const db = client.db();
      bot.use(session(db, { collectionName: 'sessions' }));
    })
    .catch((err) => {
      console.log(`can't connect to db`, err);
    });

  bot.command('/increase', (ctx, next) => {
    ctx.session.counter = ctx.session.counter || 0;
    ctx.session.counter++;
    ctx.replyWithMarkdown(`Counter updated, new value: \`${ctx.session.counter}\``);
    return next();
  });

  bot.command('/stats', (ctx) => {
    ctx.replyWithMarkdown(
      `Database has \`${ctx.session.counter}\` messages from @${ctx.from.username || ctx.from.id}`,
    );
  });

  bot.command('/remove', (ctx) => {
    ctx.replyWithMarkdown(`Removing session from database: \`${JSON.stringify(ctx.session)}\``);
    // Setting session to null, undefined or empty object/array will trigger removing it from database
    ctx.session = {};
  });
}

// connect to labmda
if (NODE_ENV === 'production') {
  // bot.telegram.setWebhook(process.env.URL).then(() => {
  //   console.log('webhook added');
  // });

  module.exports.linkCheckerBot = (event, context, callback) => {
    console.log('message received', event.body, typeof event.body);
    const body = JSON.parse(event.body);
    bot.handleUpdate(body);

    return callback(null, {
      statusCode: 200,
      body: '',
    });
  };
} else {
  bot.launch();
}

main();
