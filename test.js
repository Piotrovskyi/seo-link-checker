// const sendMessage = (method, msg, opts = {}) => {
//   const limit = 3;
//   if (msg.length > limit) {
//     for (let index = 0; index < msg.length / limit; index++) {
//       const partOfMessage = msg.substr(index * limit, limit);
//       method(partOfMessage, opts);
//     }
//   } else {
//     method(msg, opts);
//   }
// };

// sendMessage(console.log, 'abcdefghijklmnopqrstuvwxyz');

const str = 'https://yojji.io/sdg/sdh';
const regexp = /^(?:\/\/|[^/]+)*/;
// str.toLowerCase
console.log(regexp.exec(str));
