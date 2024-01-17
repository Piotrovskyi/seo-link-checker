const sendMessage = async (method, msg, opts = {}) => {
  const options = { disable_web_page_preview: true, ...opts };
  const limit = 3000;

  if (msg.length > limit) {
    for (let index = 0; index < Math.ceil(msg.length / limit); index++) {
      const partOfMessage = msg.substr(index * limit, limit);

      if (partOfMessage) {
        await method(partOfMessage, options);
      }
    }
  } else {
    await method(msg, options);
  }
};

module.exports = sendMessage;
