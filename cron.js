const getDBConnection = require('./src/dbConnection.js');
const checkLink = require('./src/checkLink.js');
const bot = require('./src/bot.js');
const botSendMessage = require('./src/botSendMessage.js');
const linksArrayToMessage = require('./src/linksArrayToMessage.js');

module.exports.cron = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const ray = Math.random();
  console.log('start cron', ray);

  const db = await getDBConnection();
  const sessions = db.collection('sessions');
  const findResult = await sessions.find({}).toArray();

  await Promise.all(
    findResult.map(async (element) => {
      console.log(element);
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
    }),
  );

  // for (let index = 0; index < findResult.length; index++) {
  // const element = findResult[index];

  // }

  console.log('finish cron', ray);

  const response = {
    statusCode: 200,
    body: '',
  };
  return callback(null, response);
};
