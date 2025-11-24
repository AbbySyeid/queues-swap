export enum QueueProvider {
  SQS = 'sqs',
  RABBIT_MQ = 'rabbitmq',
  BOTH = 'both',
}

export interface SQSConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  queueUrl: string;
}

export interface RabbitMQConfig {
  url: string;
  queueName: string;
  exchangeName: string;
  routingKey: string;
}

export interface MessageQueueModuleOptions {
  provider: QueueProvider;
  sqs?: SQSConfig;
  rabbitmq?: RabbitMQConfig;
}
