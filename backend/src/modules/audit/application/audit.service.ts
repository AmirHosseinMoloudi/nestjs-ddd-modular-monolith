import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogTypeOrmEntity, OutboxTypeOrmEntity } from '../infrastructure/entities/audit.typeorm-entities';
import { IAuditPort, AuditLogRecord } from '../../../core/application/ports/audit.port';
import { IOutboxPort, OutboxMessage } from '../../../core/application/ports/outbox.port';
import { MetricsService } from '../../../core/infrastructure/metrics/metrics.service';

@Injectable()
export class AuditService implements IAuditPort, IOutboxPort {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLogTypeOrmEntity)
    private readonly auditRepo: Repository<AuditLogTypeOrmEntity>,
    @InjectRepository(OutboxTypeOrmEntity)
    private readonly outboxRepo: Repository<OutboxTypeOrmEntity>,
    private readonly metricsService: MetricsService,
  ) {}

  public async recordAudit(record: Omit<AuditLogRecord, 'id' | 'timestamp'>): Promise<void> {
    const entity = this.auditRepo.create({
      id: crypto.randomUUID(),
      tenantId: record.tenantId,
      actorId: record.actorId,
      actorEmail: record.actorEmail,
      action: record.action,
      entityType: record.entityType,
      entityId: record.entityId,
      beforeSnapshot: record.beforeSnapshot || null,
      afterSnapshot: record.afterSnapshot || null,
      correlationId: record.correlationId || null,
    });

    await this.auditRepo.save(entity);
    this.metricsService.auditRecordsTotal.inc({
      action: record.action,
      entity_type: record.entityType,
    });
  }

  public async queryAuditTrail(tenantId: string, entityId?: string, limit: number = 50): Promise<AuditLogRecord[]> {
    const where: any = { tenantId };
    if (entityId) {
      where.entityId = entityId;
    }

    const logs = await this.auditRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return logs.map((l) => ({
      id: l.id,
      tenantId: l.tenantId,
      actorId: l.actorId,
      actorEmail: l.actorEmail,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      beforeSnapshot: l.beforeSnapshot,
      afterSnapshot: l.afterSnapshot,
      correlationId: l.correlationId || undefined,
      timestamp: l.createdAt,
    }));
  }

  public async storeMessage(message: Omit<OutboxMessage, 'status' | 'retryCount' | 'lastError'>): Promise<void> {
    const entity = this.outboxRepo.create({
      id: message.id || crypto.randomUUID(),
      aggregateType: message.aggregateType,
      aggregateId: message.aggregateId,
      eventType: message.eventType,
      payload: message.payload,
      status: 'PENDING',
      retryCount: 0,
      createdAt: message.occurredOn || new Date(),
    });

    await this.outboxRepo.save(entity);
    this.metricsService.domainEventsTotal.inc({
      event_name: message.eventType,
      aggregate_type: message.aggregateType,
    });
  }

  public async fetchPending(limit: number = 20): Promise<OutboxMessage[]> {
    const entities = await this.outboxRepo.find({
      where: { status: 'PENDING' },
      order: { createdAt: 'ASC' },
      take: limit,
    });

    return entities.map((e) => ({
      id: e.id,
      aggregateType: e.aggregateType,
      aggregateId: e.aggregateId,
      eventType: e.eventType,
      payload: e.payload,
      occurredOn: e.createdAt,
      status: e.status,
      retryCount: e.retryCount,
      lastError: e.lastError || undefined,
    }));
  }

  public async markPublished(id: string): Promise<void> {
    await this.outboxRepo.update(id, { status: 'PUBLISHED' });
  }

  public async markFailed(id: string, error: string): Promise<void> {
    await this.outboxRepo.update(id, {
      status: 'FAILED',
      lastError: error,
    });
  }

  public async getPendingCount(): Promise<number> {
    return this.outboxRepo.count({ where: { status: 'PENDING' } });
  }
}
