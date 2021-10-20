'use strict';

const { BOT_TOKEN, NODE_ENV } = process.env;
const { Telegraf } = require('telegraf');
const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => ctx.reply('Welcome'));
bot.hears('hi', (ctx) => {
  ctx.reply('Hey there');
});
bot.on('message', (ctx) => ctx.reply('Not supported command'));

if (NODE_ENV === 'production') {
  bot.telegram.setWebhook(process.env.URL).then(() => {
    console.log('webhook added');
  });

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
