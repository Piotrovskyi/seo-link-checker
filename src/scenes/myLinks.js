const { Scenes, Markup } = require("telegraf");
const linksArrayToMessage = require("../link-checker/linksArrayToMessage");
const { mainMenuButtons } = require("../bot/menus");
const sendMessage = require("../sendMessage");
const regexp = /^(?:\/\/|[^/]+)*/;

const myLinksWizard = new Scenes.WizardScene(
  "MY_LINKS",
  {
    enterHandlers: [
      (ctx) => {
        const byDomain = ctx.session.links.reduce((a, linkObj) => {
          const domainStr = regexp.exec(linkObj.link)[0];
          return {
            ...a,
            [domainStr]: a[domainStr] ? [...a[domainStr], linkObj] : [linkObj],
          };
        }, {});

        const menu = Markup.keyboard([
          ...Object.keys(byDomain).map((el) => [el]),
          ["Cancel"],
        ]).resize();

        ctx.reply("Please select domain", {
          disable_web_page_preview: true,
          ...menu,
        });
      },
    ],
  },

  async (ctx) => {
    if (ctx.message.text === "Cancel") {
      ctx.scene.leave();
      return ctx.reply("You now in main menu", mainMenuButtons(ctx));
    }
    ctx.wizard.state.data = {};
    const byDomain = ctx.session.links.reduce((a, linkObj) => {
      const domainStr = regexp.exec(linkObj.link)[0];
      return {
        ...a,
        [domainStr]: a[domainStr] ? [...a[domainStr], linkObj] : [linkObj],
      };
    }, {});

    const domain = ctx.message.text;
    const domainData = byDomain[domain];

    if (domainData.length) {
      const tableStr = linksArrayToMessage(domainData);
      await sendMessage(ctx.reply.bind(ctx), tableStr, mainMenuButtons(ctx));
    } else {
      await sendMessage(
        ctx.reply.bind(ctx),
        `You don't have any links for ${domain}`,
        mainMenuButtons(ctx)
      );
    }

    return ctx.scene.leave();
  }
);

module.exports = myLinksWizard;
