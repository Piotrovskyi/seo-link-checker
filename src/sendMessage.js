const sendMessage = async (method, msg, opts = {}) => {
  const limit = 3000;
  console.log('whole msg', msg, msg.length);

  if (msg.length > limit) {
    console.log('parts detected', Math.ceil(msg.length / limit));

    for (let index = 0; index < Math.ceil(msg.length / limit); index++) {
      console.log('msg part', index + 1, index * limit, limit);
      const partOfMessage = msg.substr(index * limit, limit);
      console.log({ partOfMessage });
      if (partOfMessage) {
        await method(partOfMessage, opts);
      }
    }
  } else {
    await method(msg, opts);
  }
};

module.exports = sendMessage;
