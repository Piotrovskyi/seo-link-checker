const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function checkLink(data) {
  try {
    console.log('start request', data);
    const res = await axios(data.page);
    console.log('page data received', data);
    const $ = cheerio.load(res.data);
    const links = $('a');

    let domainLinks = [];

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      if (link.attribs.href && link.attribs.href.includes(data.link)) {
        domainLinks.push({
          attrs: link.attribs,
          url: link.attribs.href,
        });
      }
    }

    // console.log({ domainLinks });

    return { ...data, valid: !!domainLinks.length, checked: new Date().toISOString() };
  } catch (err) {
    console.log(err);
    return { ...data, valid: false };
  }
};
