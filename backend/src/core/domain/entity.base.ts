import { IDomainEvent } from './domain-event.base';

export abstract class BaseEntity<TId> {
  protected readonly _id: TId;
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;

  constructor(id: TId, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  public get id(): TId {
    return this._id;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public equals(other?: BaseEntity<TId>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (this === other) {
      return true;
    }
    return this._id === other._id;
  }
}

export abstract class AggregateRoot<TId> extends BaseEntity<TId> {
  private _domainEvents: IDomainEvent[] = [];
  protected _version: number;

  constructor(id: TId, version: number = 1, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this._version = version;
  }

  public get version(): number {
    return this._version;
  }

  public get domainEvents(): ReadonlyArray<IDomainEvent> {
    return [...this._domainEvents];
  }

  protected addDomainEvent(event: IDomainEvent): void {
    this._domainEvents.push(event);
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  public incrementVersion(): void {
    this._version += 1;
    this._updatedAt = new Date();
  }
}
