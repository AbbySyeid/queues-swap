import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
} from '@aws-sdk/client-sqs';
import {
  IQueueProvider,
  QueueMessage,
} from '../interfaces/queue-provider.interface';
import { SQSConfig } from '../interfaces/queue-config.interface';

@Injectable()
export class SQSProvider implements IQueueProvider, OnModuleDestroy {
  private readonly logger = new Logger(SQSProvider.name);
  private client: SQSClient;
  private isPolling = false;
  private pollingInterval: NodeJS.Timeout;

  constructor(private readonly config: SQSConfig) {}

  async connect(): Promise<void> {
    this.logger.log('Connecting to AWS SQS...');

    this.client = new SQSClient({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      ...(this.config.endpoint && { endpoint: this.config.endpoint }),
    });

    this.logger.log('Successfully connected to AWS SQS');
  }

  async publish(message: QueueMessage): Promise<string> {
    try {
      const command = new SendMessageCommand({
        QueueUrl: this.config.queueUrl,
        MessageBody: JSON.stringify(message.body),
        MessageAttributes: this.convertToSQSAttributes(message?.attributes),
      });

      const response = await this.client.send(command);
      this.logger.log(`Message published to SQS: ${response.MessageId}`);
      return response.MessageId;
    } catch (error) {
      this.logger.error('Failed to publish message to SQS', error.stack);
      throw error;
    }
  }

  async subscribe(
    callback: (message: QueueMessage) => Promise<void>,
  ): Promise<void> {
    if (this.isPolling) {
      this.logger.warn('Already subscribed to SQS queue');
      return;
    }

    this.isPolling = true;
    this.logger.log('Starting SQS message polling...');

    this.startPolling(callback);
  }

  private startPolling(
    callback: (message: QueueMessage) => Promise<void>,
  ): void {
    const poll = async () => {
      if (!this.isPolling) return;

      try {
        const command = new ReceiveMessageCommand({
          QueueUrl: this.config.queueUrl,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 20, // Long polling
          MessageAttributeNames: ['All'],
        });

        const response = await this.client.send(command);

        if (response.Messages && response.Messages.length > 0) {
          for (const sqsMessage of response.Messages) {
            await this.processMessage(sqsMessage, callback);
          }
        }
      } catch (error) {
        this.logger.error('Error polling SQS messages', error.stack);
      }

      if (this.isPolling) {
        this.pollingInterval = setTimeout(poll, 1000);
      }
    };

    poll();
  }

  private async processMessage(
    sqsMessage: Message,
    callback: (message: QueueMessage) => Promise<void>,
  ): Promise<void> {
    try {
      const message: QueueMessage = {
        id: sqsMessage.MessageId,
        body: JSON.parse(sqsMessage.Body),
        attributes: this.convertFromSQSAttributes(sqsMessage.MessageAttributes),
        timestamp: new Date(),
      };

      await callback(message);

      // Delete message after successful processing
      await this.deleteMessage(sqsMessage.ReceiptHandle);
    } catch (error) {
      this.logger.error('Error processing SQS message', error.stack);
    }
  }

  private async deleteMessage(receiptHandle: string): Promise<void> {
    try {
      const command = new DeleteMessageCommand({
        QueueUrl: this.config.queueUrl,
        ReceiptHandle: receiptHandle,
      });

      await this.client.send(command);
      this.logger.debug('Message deleted from SQS');
    } catch (error) {
      this.logger.error('Failed to delete message from SQS', error.stack);
    }
  }

  async disconnect(): Promise<void> {
    this.logger.log('Disconnecting from AWS SQS...');
    this.isPolling = false;

    if (this.pollingInterval) {
      clearTimeout(this.pollingInterval);
    }

    if (this.client) {
      this.client.destroy();
    }

    this.logger.log('Disconnected from AWS SQS');
  }

  getProviderName(): string {
    return 'SQS';
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private convertToSQSAttributes(attributes?: Record<string, any>): any {
    if (!attributes) return undefined;

    const sqsAttributes = {};
    for (const [key, value] of Object.entries(attributes)) {
      sqsAttributes[key] = {
        DataType: 'String',
        StringValue: String(value),
      };
    }
    return sqsAttributes;
  }

  private convertFromSQSAttributes(sqsAttributes?: any): Record<string, any> {
    if (!sqsAttributes) return {};

    const attributes = {};
    for (const [key, value] of Object.entries(sqsAttributes)) {
      attributes[key] = (value as any).StringValue;
    }
    return attributes;
  }
}
