const botSendMessage = async (method, address, msg, opts = {}) => {
  const limit = 3000;
  console.log('whole msg', msg, msg.length);

  if (msg.length > limit) {
    console.log('parts detected', Math.ceil(msg.length / limit));

    for (let index = 0; index < Math.ceil(msg.length / limit); index++) {
      console.log('msg part', index + 1, index * limit, limit);
      const partOfMessage = msg.substr(index * limit, limit);
      console.log({ partOfMessage });
      if (partOfMessage) {
        await method(address, partOfMessage, opts);
      }
    }
  } else {
    await method(address, msg, opts);
  }
};

module.exports = botSendMessage;
