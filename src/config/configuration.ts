export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  queue: {
    provider: process.env.QUEUE_PROVIDER || 'rabbitmq',

    sqs: {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      endpoint: process.env.SQS_ENDPOINT,
      queueUrl: process.env.SQS_QUEUE_URL || '',
    },

    rabbitmq: {
      url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
      queueName: process.env.RABBITMQ_QUEUE_NAME || 'test-queue',
    },
  },
});
