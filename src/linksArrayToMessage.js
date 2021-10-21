const { DateTime } = require('luxon');

module.exports = (linkArray) => {
  const msg = linkArray
    .map((row) => {
      const data = {
        page: row.page,
        link: row.link,
        valid: row.valid ? '✅' : '❌',
        lastChecked: DateTime.fromISO(row.checked).toLocaleString(DateTime.DATETIME_FULL),
        error: row.error,
      };
      return Object.keys(data)
        .map((key) => (data[key] ? `${key}: ${data[key]}` : ''))
        .filter((e) => e)
        .join('\n');
    })
    .join('\n\n');

  console.log({ msg });
  return msg;
};
