import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  IQueueProvider,
  QueueMessage,
} from './interfaces/queue-provider.interface';

@Injectable()
export class MessageQueueService implements OnModuleInit {
  private readonly logger = new Logger(MessageQueueService.name);
  private messageHandlers: Array<(message: QueueMessage) => Promise<void>> = [];

  constructor(private readonly providers: IQueueProvider[]) {
    this.logger.log(
      `Initialized with ${providers.length} provider(s): ${providers.map((p) => p.getProviderName()).join(', ')}`,
    );
  }

  async onModuleInit() {
    for (const provider of this.providers) {
      await provider.connect();
    }

    for (const provider of this.providers) {
      await provider.subscribe(async (message) => {
        await this.handleMessage(message, provider.getProviderName());
      });
    }
  }

  async publishToAll(
    message: QueueMessage,
  ): Promise<{ provider: string; messageId: string }[]> {
    const results = [];

    for (const provider of this.providers) {
      try {
        const messageId = await provider.publish(message);
        results.push({
          provider: provider.getProviderName(),
          messageId,
        });
      } catch (error) {
        this.logger.error(
          `Failed to publish to ${provider.getProviderName()}`,
          error.stack,
        );
        throw error;
      }
    }

    return results;
  }

  async publishToProvider(
    message: QueueMessage,
    providerName: string,
  ): Promise<string> {
    const provider = this.providers.find(
      (p) => p.getProviderName().toLowerCase() === providerName.toLowerCase(),
    );

    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    return await provider.publish(message);
  }

  registerMessageHandler(
    handler: (message: QueueMessage) => Promise<void>,
  ): void {
    this.messageHandlers.push(handler);
    this.logger.log('Message handler registered');
  }

  private async handleMessage(
    message: QueueMessage,
    providerName: string,
  ): Promise<void> {
    this.logger.log(`Received message from ${providerName}: ${message.id}`);

    for (const handler of this.messageHandlers) {
      try {
        await handler(message);
      } catch (error) {
        this.logger.error('Error in message handler', error.stack);
      }
    }
  }

  getActiveProviders(): string[] {
    return this.providers.map((p) => p.getProviderName());
  }
}
