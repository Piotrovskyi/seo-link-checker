const sendMessage = (method, msg, opts = {}) => {
  const limit = 4096;
  if (msg.length > limit) {
    for (let index = 0; index < msg.length / limit; index++) {
      const partOfMessage = msg.substr(index * limit, limit);
      method(partOfMessage, opts);
    }
  } else {
    method(msg, opts);
  }
};

module.exports = sendMessage;
