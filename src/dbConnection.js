const { MONGODB_URI } = process.env;
const { MongoClient } = require('mongodb');

let dbObject = null;
const getDBConnection = async () => {
  if (dbObject && dbObject.serverConfig.isConnected()) return dbObject;

  const client = await MongoClient.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  dbObject = client.db();
  return dbObject;
};

module.exports = getDBConnection;
