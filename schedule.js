const { SQSClient, SendMessageCommand, GetQueueUrlCommand } = require('@aws-sdk/client-sqs');
const getDBConnection = require('./src/dbConnection');
const sqsClient = new SQSClient({ region: 'eu-west-1' });

const params = {};

const run = async () => {
  try {
    const db = await getDBConnection();
    const sessions = db.collection('sessions');
    const queueUrl = await sqsClient.send(
      new GetQueueUrlCommand({ QueueName: 'LinkCheckerBotQueue' }),
    );
    params.QueueUrl = queueUrl.QueueUrl;

    const findResult = await sessions.find({}).toArray();
    for (let index = 0; index < findResult.length; index++) {
      const element = findResult[index];

      params.MessageBody = JSON.stringify(element);
      await sqsClient.send(new SendMessageCommand(params));
    }
  } catch (err) {
    console.log('Error', err);
  }
};

module.exports.schedule = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  await run();

  const response = {
    statusCode: 200,
    body: '',
  };
  return callback(null, response);
};
