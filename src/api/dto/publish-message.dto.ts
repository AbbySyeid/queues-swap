import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { QueueProvider } from '../../message-queue/interfaces/queue-config.interface';

export class PublishMessageDto {
  @ApiProperty({
    description: 'Message content',
    example: { text: 'Message', priority: 'high' },
  })
  @IsNotEmpty()
  @IsObject()
  message: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Optional message attributes/metadata',
    example: { source: 'api', version: '1.0' },
  })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}

export class PublishToProviderDto extends PublishMessageDto {
  @ApiProperty({
    description: 'Queue provider to use',
    enum: QueueProvider,
    example: QueueProvider.RABBIT_MQ,
  })
  @IsNotEmpty()
  @IsString()
  provider: string;
}
