const sendMessage = async (method, msg, opts = {}) => {
  const limit = 3000;

  if (msg.length > limit) {
    for (let index = 0; index < msg.length / limit + 1; index++) {
      const partOfMessage = msg.substr(index * limit, limit);
      if (partOfMessage) {
        await method(partOfMessage, opts);
      }
    }
  } else {
    await method(msg, opts);
  }
};

module.exports = sendMessage;
