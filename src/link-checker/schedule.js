/*
Cron type lambda that schedule link checking for all users to the sqs queue
*/

const {
  SQSClient,
  SendMessageCommand,
  GetQueueUrlCommand,
} = require("@aws-sdk/client-sqs");

const getDBConnection = require("../dbConnection");
const sqsClient = new SQSClient({ region: "eu-west-1" });

const params = {};

const run = async () => {
  try {
    const db = await getDBConnection();
    const sessions = db.collection("sessions");
    const queueUrl = await sqsClient.send(
      new GetQueueUrlCommand({ QueueName: "LinkCheckerBotQueue" })
    );
    params.QueueUrl = queueUrl.QueueUrl;

    const dbItems = await sessions.find({}).toArray();
    for (let index = 0; index < dbItems.length; index++) {
      params.MessageBody = JSON.stringify(dbItems[index]);
      await sqsClient.send(new SendMessageCommand(params));
    }
  } catch (err) {
    console.log(err.message);
  }
};

module.exports.schedule = async (_, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  await run();

  const response = {
    statusCode: 200,
    body: "",
  };
  return callback(null, response);
};
