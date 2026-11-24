export interface OutboxMessage {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: string;
  occurredOn: Date;
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';
  retryCount: number;
  lastError?: string;
}

export interface IOutboxPort {
  storeMessage(message: Omit<OutboxMessage, 'status' | 'retryCount' | 'lastError'>): Promise<void>;
  fetchPending(limit?: number): Promise<OutboxMessage[]>;
  markPublished(id: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
}

export const OUTBOX_PORT = Symbol('OUTBOX_PORT');
