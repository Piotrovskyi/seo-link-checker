'use strict';

const { BOT_TOKEN, NODE_ENV, MONGODB_URI } = process.env;
const { Telegraf } = require('telegraf');
const bot = new Telegraf(BOT_TOKEN, { webhookReply: true });
const { session } = require('telegraf-session-mongodb');
const { MongoClient } = require('mongodb');

let dbObject = null;
const getDBConnection = async () => {
  try {
    if (dbObject && dbObject.serverConfig.isConnected()) return dbObject;

    const client = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    dbObject = client.db();
    return dbObject;
  } catch (err) {
    throw err;
  }
};

async function main() {
  // connect to db
  const db = await getDBConnection();
  bot.use(session(db, { collectionName: 'sessions' }));
  console.log('db connected');

  // // add handlers
  // bot.command('/increase', (ctx, next) => {
  //   ctx.session.counter = ctx.session.counter || 0;
  //   ctx.session.counter++;
  //   ctx.replyWithMarkdown(`Counter updated, new value: \`${ctx.session.counter}\``);
  //   return next();
  // });

  // bot.command('/stats', (ctx) => {
  //   ctx.replyWithMarkdown(
  //     `Database has \`${ctx.session.counter}\` messages from @${ctx.from.username || ctx.from.id}`,
  //   );
  // });

  // bot.command('/remove', (ctx) => {
  //   ctx.replyWithMarkdown(`Removing session from database: \`${JSON.stringify(ctx.session)}\``);
  //   ctx.session = {};
  // });
}

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
