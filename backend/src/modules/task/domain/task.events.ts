import { BaseDomainEvent } from '../../../core/domain/domain-event.base';

export class TaskCreatedDomainEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      tenantId: string;
      title: string;
      priority: string;
      creatorId: string;
      requiresApproval: boolean;
      deadline?: string | null;
    },
    correlationId?: string,
  ) {
    super(aggregateId, 'TaskAggregate', 'TaskCreatedDomainEvent', payload, correlationId);
  }
}

export class TaskStatusChangedDomainEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      tenantId: string;
      fromStatus: string;
      toStatus: string;
      actorId: string;
      version: number;
    },
    correlationId?: string,
  ) {
    super(aggregateId, 'TaskAggregate', 'TaskStatusChangedDomainEvent', payload, correlationId);
  }
}

export class TaskAssignedDomainEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      tenantId: string;
      assigneeId: string;
      assigneeEmail?: string;
      actorId: string;
    },
    correlationId?: string,
  ) {
    super(aggregateId, 'TaskAggregate', 'TaskAssignedDomainEvent', payload, correlationId);
  }
}

export class TaskApprovedDomainEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      tenantId: string;
      approverId: string;
      decision: 'APPROVED' | 'REJECTED';
      comments?: string;
    },
    correlationId?: string,
  ) {
    super(aggregateId, 'TaskAggregate', 'TaskApprovedDomainEvent', payload, correlationId);
  }
}
