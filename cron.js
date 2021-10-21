const getDBConnection = require('./src/dbConnection.js');
const checkLink = require('./src/checkLink.js');
const bot = require('./src/bot.js');

module.exports.cron = async (event, context, callback) => {
  const db = await getDBConnection();
  const sessions = db.collection('sessions');
  const findResult = await sessions.find({}).toArray();

  // console.log(findResult);

  for (let index = 0; index < findResult.length; index++) {
    const element = findResult[index];
    if (!element.data.links) {
      continue;
    }

    const oldLinks = element.data.links;

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

    const statusChangedLinks = res.filter((linkObj, i) => {
      return oldLinks[i].valid !== linkObj.valid;
    });
    if (statusChangedLinks.length) {
      const msg = [
        'Status changed for links',
        ...statusChangedLinks.map((linkObj) => `${linkObj.page}: valid - ${linkObj.valid}`),
      ].join('\n');

      console.log(element.key.split(':')[0], msg);
      bot.telegram.sendMessage(element.key.split(':')[0], msg, { disable_web_page_preview: true });
    } else {
      console.log(element.key.split(':')[0], 'Links checked: all is ok');
      bot.telegram.sendMessage(element.key.split(':')[0], 'Links checked: all is ok');
    }
  }

  const response = {
    statusCode: 200,
    body: '',
  };
  return callback(null, response);
};
