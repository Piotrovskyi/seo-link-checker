const { MONGODB_URI } = process.env;
const { MongoClient } = require('mongodb');

let dbObject = null;
let client = new MongoClient(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const clientPromise = client.connect();

const getDBConnection = async () => {
  if (dbObject && dbObject.serverConfig.isConnected()) return dbObject;

  client = await clientPromise;
  dbObject = client.db();

  console.log('db connected');
  return dbObject;
};

module.exports = getDBConnection;
