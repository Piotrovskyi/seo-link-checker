/*
Suppose to pull link page and check if link is on that page
*/

const axios = require('axios');
const cheerio = require('cheerio');
const { CHECK_LINK_TIMEOUT } = process.env;

module.exports = async function checkLink(data) {
  try {
    const res = await axios.get(data.page, { timeout: CHECK_LINK_TIMEOUT || 8000 });

    const $ = cheerio.load(res.data);
    const links = $('a');

    let domainLinks = [];

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      if (link.attribs.href && link.attribs.href.includes(data.link)) {
        domainLinks.push({
          attrs: link.attribs || {},
          url: link.attribs.href,
        });
      }
    }

    return {
      ...data,
      error: null,
      valid:
        !!domainLinks.length &&
        domainLinks.some((link) => (link.attrs.rel || '').toLowerCase() !== 'nofollow'),
      checked: new Date().toISOString(),
    };
  } catch (err) {
    console.log(err.message);
    return { ...data, valid: false, checked: new Date().toISOString(), error: err.message };
  }
};
