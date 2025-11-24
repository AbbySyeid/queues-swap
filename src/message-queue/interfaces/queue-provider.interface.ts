export interface QueueMessage {
  id?: string;
  body: Record<string, unknown>;
  attributes?: Record<string, unknown>;
  timestamp?: Date;
}

export interface IQueueProvider {
  publish(message: QueueMessage): Promise<string>;

  subscribe(callback: (message: QueueMessage) => Promise<void>): Promise<void>;

  connect(): Promise<void>;

  disconnect(): Promise<void>;

  getProviderName(): string;
}
