/*
Queue consumer function that checks links in the queue and store results in the database (lambda function)
*/

const botSendMessage = require("../bot/botSendMessage.js");
const checkLink = require("./checkLink.js");
const getDBConnection = require("../dbConnection.js");
const linksArrayToMessage = require("../linksArrayToMessage.js");
const bot = require("../bot/bot.js");
const { OWNER_CHAT_ADDRESS } = process.env;

const fullName = (msg) => msg.from.first_name + " " + msg.from.last_name;

module.exports.checkScheduledLink = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const db = await getDBConnection();
  const sessions = db.collection("sessions");

  try {
    const { data, key } = JSON.parse(event.Records[0].body);

    if (!data.links) {
      return;
    }

    const res = await Promise.all(data.links.map(checkLink));

    const filter = { key };
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
    const keyLeft = key.split(":")[0];

    if (invalidLinks.length) {
      const tableStr = linksArrayToMessage(invalidLinks);
      const msg =
        `We found some problems (${invalidLinks.length}): \n` + tableStr;
      await botSendMessage(
        bot.telegram.sendMessage.bind(bot.telegram),
        keyLeft,
        msg,
        {
          disable_web_page_preview: true,
        }
      );
    } else {
      await botSendMessage(
        bot.telegram.sendMessage.bind(bot.telegram),
        keyLeft,
        `Links checked (${element.data.links?.length}): no issues found`
      );
    }
  } catch (err) {
    console.log(err);

    await botSendMessage(
      bot.telegram.sendMessage.bind(bot.telegram),
      OWNER_CHAT_ADDRESS,
      `⚙️ Sys message cron check err (${fullName(err.message)})\n`
    ).catch(() => {});
  }

  const response = {
    statusCode: 200,
    body: "",
  };
  return callback(null, response);
};
