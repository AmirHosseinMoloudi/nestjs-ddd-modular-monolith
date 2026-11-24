export interface IDomainEvent {
  readonly eventId: string;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly eventName: string;
  readonly occurredOn: Date;
  readonly payload: Record<string, any>;
  readonly correlationId?: string;
}

export abstract class BaseDomainEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly aggregateType: string,
    public readonly eventName: string,
    public readonly payload: Record<string, any>,
    public readonly correlationId?: string,
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
  }
}
