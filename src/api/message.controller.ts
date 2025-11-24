import { Body, Controller, Get, Post, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MessageQueueService } from '../message-queue/message-queue.service';
import {
  PublishMessageDto,
  PublishToProviderDto,
} from './dto/publish-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';

export class ProvidersCheck {
  status: string;
  providers: string[];
}

@ApiTags('Messages')
@Controller('messages')
export class MessageController {
  private readonly logger = new Logger(MessageController.name);

  constructor(private readonly queueService: MessageQueueService) {
    this.queueService.registerMessageHandler(async (message) => {
      this.logger.log(`📨 Received message: ${JSON.stringify(message)}`);
    });
  }

  @Post('publish')
  @ApiOperation({ summary: 'Publish a message to all configured queues' })
  @ApiResponse({
    status: 201,
    description: 'Message published successfully',
    type: [MessageResponseDto],
  })
  async publishToAll(
    @Body() dto: PublishMessageDto,
  ): Promise<MessageResponseDto[]> {
    this.logger.log('Publishing message to all providers');

    const results = await this.queueService.publishToAll({
      body: dto.message,
      attributes: dto.attributes,
    });

    return results;
  }

  @Post('publish/provider')
  @ApiOperation({ summary: 'Publish a message to a specific queue provider' })
  @ApiResponse({
    status: 201,
    description: 'Message published successfully',
    type: MessageResponseDto,
  })
  async publishToProvider(
    @Body() dto: PublishToProviderDto,
  ): Promise<MessageResponseDto> {
    this.logger.log(`Publishing message to ${dto.provider}`);

    const messageId = await this.queueService.publishToProvider(
      {
        body: dto.message,
        attributes: dto.attributes,
      },
      dto.provider,
    );

    return {
      provider: dto.provider,
      messageId,
    };
  }

  @Get('active-providers')
  @ApiOperation({ summary: 'Check active providers' })
  @ApiResponse({
    status: 200,
    description: 'Service health status',
    type: ProvidersCheck,
  })
  getActiveProviders(): ProvidersCheck {
    return {
      status: 'ok',
      providers: this.queueService.getActiveProviders(),
    };
  }
}
