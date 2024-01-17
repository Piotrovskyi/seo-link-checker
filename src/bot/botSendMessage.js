const botSendMessage = async (method, address, msg, opts = {}) => {
  const limit = 3000;

  if (msg.length > limit) {
    for (let index = 0; index < Math.ceil(msg.length / limit); index++) {
      const partOfMessage = msg.substr(index * limit, limit);

      if (partOfMessage) {
        await method(address, partOfMessage, opts);
      }
    }
  } else {
    await method(address, msg, opts);
  }
};

module.exports = botSendMessage;
