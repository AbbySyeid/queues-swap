import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({
    description: 'Queue provider name',
    example: 'RabbitMQ',
  })
  provider: string;

  @ApiProperty({
    description: 'Message ID assigned by the queue',
    example: '1234567890-abc123',
  })
  messageId: string;
}
