const botSendMessage = (method, address, msg, opts = {}) => {
  const limit = 4096;
  if (msg.length > limit) {
    for (let index = 0; index < msg.length + 1 / limit; index++) {
      const partOfMessage = msg.substr(index * limit, limit);
      method(address, partOfMessage, opts);
    }
  } else {
    method(address, msg, opts);
  }
};

module.exports = botSendMessage;
