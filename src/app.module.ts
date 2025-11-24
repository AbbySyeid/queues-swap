import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { MessageController } from './api/message.controller';
import {
  MessageQueueModuleOptions,
  QueueProvider,
} from './message-queue/interfaces/queue-config.interface';
import { MessageQueueModule } from './message-queue/message-queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MessageQueueModule.registerAsync({
      useFactory: (configService: ConfigService): MessageQueueModuleOptions => {
        const provider = configService.get<string>(
          'queue.provider',
        ) as QueueProvider;

        return {
          provider,
          sqs:
            provider === QueueProvider.SQS || provider === QueueProvider.BOTH
              ? configService.get('queue.sqs')
              : undefined,
          rabbitmq:
            provider === QueueProvider.RABBIT_MQ ||
            provider === QueueProvider.BOTH
              ? configService.get('queue.rabbitmq')
              : undefined,
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [MessageController],
})
export class AppModule {}
