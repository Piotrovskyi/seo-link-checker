// eslint-disable-next-line no-undef
const { NODE_ENV, OWNER_CHAT_ADDRESS } = process.env;
const { Telegraf, Scenes } = require("telegraf");
const { session } = require("telegraf-session-mongodb");
const bot = require("./bot.js");
const checkLink = require("../link-checker/checkLink.js");
const sendMessage = require("../sendMessage.js");

const getDBConnection = require("../dbConnection.js");
const linksArrayToMessage = require("../link-checker/linksArrayToMessage.js");
const newLinkWizard = require("../scenes/addLink.js");
const removeLinkWizard = require("../scenes/removeLink.js");
const { mainMenuButtons, add, list, remove, check } = require("./menus.js");
const myLinksWizard = require("../scenes/myLinks.js");
const { DateTime } = require("luxon");
const botSendMessage = require("./botSendMessage.js");

const stage = new Scenes.Stage([
  newLinkWizard,
  removeLinkWizard,
  myLinksWizard,
]);

const fullName = (msg) => msg.from.first_name + " " + msg.from.last_name;

async function main() {
  bot.use(Telegraf.log());

  const db = await getDBConnection();

  bot.use(session(db, { collectionName: "sessions" }));
  console.log("db connected");

  bot.use(async (ctx, next) => {
    if (ctx.message) {
      ctx.session.user = ctx.message.from;
      await botSendMessage(
        bot.telegram.sendMessage.bind(bot.telegram),
        OWNER_CHAT_ADDRESS,
        `⚙️ Sys message (${fullName(ctx.message)})\n` + ctx.message.text
      ).catch(() => {});
    }
    await next(); // runs next middleware
  });

  bot.use(stage.middleware());
  console.log("middlewares connected");

  bot.hears("Cancel", (ctx) => {
    ctx.scene.leave();
    return ctx.reply("You now in main menu", mainMenuButtons(ctx));
  });

  bot.start((ctx) => {
    return ctx.reply(
      "Welcome to link checker bot. Please add links which you want to check one by one",
      mainMenuButtons(ctx)
    );
  });

  bot.hears(add, (ctx) => ctx.scene.enter("ADD_LINK"));

  bot.hears(list, async (ctx) => {
    if (!ctx.session.links || !ctx.session.links.length) {
      return ctx.reply(`You don't have any links yet`);
    }
    return ctx.scene.enter("MY_LINKS");
  });

  bot.hears(remove, (ctx) => ctx.scene.enter("REMOVE_LINK"));

  bot.hears(check, async (ctx) => {
    if (!ctx.session.links || !ctx.session.links.length) {
      return ctx.reply(`You don't have any links yet`);
    }

    if (
      DateTime.fromISO(ctx.session.manualCheckTimeStamp)
        .diffNow("minutes")
        .toObject().minutes > -1
    ) {
      return ctx.reply(
        "You can do manual check only once in a minute, try again later"
      );
    }

    const checkedLinks = await Promise.all(ctx.session.links.map(checkLink));
    ctx.session.links = checkedLinks;

    const tableStr = linksArrayToMessage(checkedLinks);
    await sendMessage(ctx.reply.bind(ctx), tableStr, {
      disable_web_page_preview: true,
    });
    ctx.session.manualCheckTimeStamp = new Date().toISOString();
    ctx.reply(
      ctx.session.links.every((link) => link.valid)
        ? "All ok"
        : "Not ok, check list"
    );
  });
}


// connect to labmda
if (NODE_ENV === "production") {
  module.exports.linkCheckerBot = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    try {
      const body = JSON.parse(event.body);
      await main();
      await bot.handleUpdate(body);
    } catch (err) {
      console.log(err);
      await botSendMessage(
        bot.telegram.sendMessage.bind(bot.telegram),
        OWNER_CHAT_ADDRESS,
        "⚙️ Sys err message\n" + err
      );
    }

    const response = {
      statusCode: 200,
      body: "",
    };

    return callback(null, response);
  };
} else {
  main().then(() => {
    bot.launch();
  });
}
