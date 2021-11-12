const botSendMessage = require('./src/botSendMessage');
const checkLink = require('./src/checkLink');
const getDBConnection = require('./src/dbConnection');
const linksArrayToMessage = require('./src/linksArrayToMessage');
const bot = require('./src/bot.js');
const { OWNER_CHAT_ADDRESS } = process.env;

const fullName = (msg) => msg.from.first_name + ' ' + msg.from.last_name;

module.exports.checkScheduledLink = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const db = await getDBConnection();
  const sessions = db.collection('sessions');
  try {
    const element = JSON.parse(event.Records[0].body);

    if (!element.data.links) {
      return;
    }

    const res = await Promise.all(element.data.links.map(checkLink));

    const filter = { key: element.key };
    const options = { upsert: true };
    const updateDoc = {
      $set: {
        data: {
          links: res,
        },
      },
    };
    await sessions.updateOne(filter, updateDoc, options);

    const invalidLinks = res.filter((linkObj) => !linkObj.valid);

    if (invalidLinks.length) {
      const tableStr = linksArrayToMessage(invalidLinks);
      const msg = `We found some problems (${invalidLinks.length}): \n` + tableStr;
      await botSendMessage(
        bot.telegram.sendMessage.bind(bot.telegram),
        element.key.split(':')[0],
        msg,
        {
          disable_web_page_preview: true,
        },
      );
    } else {
      await botSendMessage(
        bot.telegram.sendMessage.bind(bot.telegram),
        element.key.split(':')[0],
        `Links checked (${element.data.links?.length}): no issues found`,
      );
    }
  } catch (err) {
    console.log(err);
    await botSendMessage(
      bot.telegram.sendMessage.bind(bot.telegram),
      OWNER_CHAT_ADDRESS,
      `⚙️ Sys message cron check err (${fullName(err.message)})\n`,
    ).catch(() => {});
  }

  const response = {
    statusCode: 200,
    body: '',
  };
  return callback(null, response);
};
