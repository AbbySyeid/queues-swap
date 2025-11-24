import { DynamicModule, Module } from '@nestjs/common';
import { MessageQueueService } from './message-queue.service';
import { IQueueProvider } from './interfaces/queue-provider.interface';
import {
  MessageQueueModuleOptions,
  QueueProvider,
} from './interfaces/queue-config.interface';
import { SQSProvider } from './providers/sqs.provider';
import { RabbitMQProvider } from './providers/rabbitmq.provider';

@Module({})
export class MessageQueueModule {
  static register(options: MessageQueueModuleOptions): DynamicModule {
    const providers: IQueueProvider[] = [];

    if (
      options.provider === QueueProvider.SQS ||
      options.provider === QueueProvider.BOTH
    ) {
      if (!options.sqs) {
        throw new Error(
          'SQS configuration is required when provider is "sqs" or "both"',
        );
      }
      providers.push(new SQSProvider(options.sqs));
    }

    if (
      options.provider === QueueProvider.RABBIT_MQ ||
      options.provider === QueueProvider.BOTH
    ) {
      if (!options.rabbitmq) {
        throw new Error(
          'RabbitMQ configuration is required when provider is "rabbitmq" or "both"',
        );
      }
      providers.push(new RabbitMQProvider(options.rabbitmq));
    }

    if (providers.length === 0) {
      throw new Error('At least one queue provider must be configured');
    }

    return {
      module: MessageQueueModule,
      providers: [
        {
          provide: 'QUEUE_PROVIDERS',
          useValue: providers,
        },
        {
          provide: MessageQueueService,
          useFactory: () => {
            return new MessageQueueService(providers);
          },
        },
      ],
      exports: [MessageQueueService],
    };
  }

  static registerAsync(options: {
    useFactory: (
      ...args: any[]
    ) => Promise<MessageQueueModuleOptions> | MessageQueueModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: MessageQueueModule,
      providers: [
        {
          provide: 'QUEUE_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: 'QUEUE_PROVIDERS',
          useFactory: (queueOptions: MessageQueueModuleOptions) => {
            const providers: IQueueProvider[] = [];

            if (
              queueOptions.provider === QueueProvider.SQS ||
              queueOptions.provider === QueueProvider.BOTH
            ) {
              if (!queueOptions.sqs) {
                throw new Error('SQS configuration is required');
              }
              providers.push(new SQSProvider(queueOptions.sqs));
            }

            if (
              queueOptions.provider === QueueProvider.RABBIT_MQ ||
              queueOptions.provider === QueueProvider.BOTH
            ) {
              if (!queueOptions.rabbitmq) {
                throw new Error('RabbitMQ configuration is required');
              }
              providers.push(new RabbitMQProvider(queueOptions.rabbitmq));
            }

            return providers;
          },
          inject: ['QUEUE_OPTIONS'],
        },
        {
          provide: MessageQueueService,
          useFactory: (providers: IQueueProvider[]) => {
            return new MessageQueueService(providers);
          },
          inject: ['QUEUE_PROVIDERS'],
        },
      ],
      exports: [MessageQueueService],
    };
  }
}
