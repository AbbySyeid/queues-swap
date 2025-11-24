import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConsumeMessage, connect } from 'amqplib';
import {
  IQueueProvider,
  QueueMessage,
} from '../interfaces/queue-provider.interface';
import {
  QueueProvider,
  RabbitMQConfig,
} from '../interfaces/queue-config.interface';

@Injectable()
export class RabbitMQProvider implements IQueueProvider, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQProvider.name);
  private connection: any;
  private channel: any;

  constructor(private readonly config: RabbitMQConfig) {}

  async connect(): Promise<void> {
    try {
      this.logger.log('Connecting to RabbitMQ...');

      this.connection = await connect(this.config.url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertQueue(this.config.queueName, {
        durable: true,
      });

      this.logger.log('Successfully connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error.stack);
      throw error;
    }
  }

  async publish(message: QueueMessage): Promise<string> {
    try {
      const messageId = this.generateMessageId();
      const messageBuffer = Buffer.from(JSON.stringify(message.body));

      const published = this.channel.sendToQueue(
        this.config.queueName,
        messageBuffer,
        {
          persistent: true,
          messageId,
          timestamp: Date.now(),
          headers: message?.attributes,
        },
      );

      if (!published) {
        throw new Error('Failed to publish message to RabbitMQ');
      }

      this.logger.log(`Message published to RabbitMQ: ${messageId}`);
      return messageId;
    } catch (error) {
      this.logger.error('Failed to publish message to RabbitMQ', error.stack);
      throw error;
    }
  }

  async subscribe(
    callback: (message: QueueMessage) => Promise<void>,
  ): Promise<void> {
    try {
      this.logger.log('Starting RabbitMQ message consumption...');

      await this.channel.consume(
        this.config.queueName,
        async (msg) => {
          if (msg) {
            await this.processMessage(msg, callback);
          }
        },
        {
          noAck: false,
        },
      );

      this.logger.log('Successfully subscribed to RabbitMQ queue');
    } catch (error) {
      this.logger.error('Failed to subscribe to RabbitMQ', error.stack);
      throw error;
    }
  }

  private async processMessage(
    msg: ConsumeMessage,
    callback: (message: QueueMessage) => Promise<void>,
  ): Promise<void> {
    try {
      const message: QueueMessage = {
        id: msg.properties.messageId,
        body: JSON.parse(msg.content.toString()),
        attributes: msg.properties.headers,
        timestamp: new Date(msg.properties.timestamp),
      };

      await callback(message);

      this.channel.ack(msg);
      this.logger.debug('Message acknowledged in RabbitMQ');
    } catch (error) {
      this.logger.error('Error processing RabbitMQ message', error.stack);
      this.channel.nack(msg, false, true);
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.logger.log('Disconnecting from RabbitMQ...');

      if (this.channel) {
        await this.channel.close();
      }

      if (this.connection) {
        await this.connection.close();
      }

      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error.stack);
    }
  }

  getProviderName(): string {
    return QueueProvider.RABBIT_MQ;
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
