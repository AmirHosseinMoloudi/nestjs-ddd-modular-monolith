import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
@Index(['tenantId', 'createdAt'])
@Index(['tenantId', 'entityId'])
export class AuditLogTypeOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  tenantId: string;

  @Column('varchar', { length: 36 })
  actorId: string;

  @Column('varchar', { length: 150 })
  actorEmail: string;

  @Column('varchar', { length: 50 })
  action: string;

  @Column('varchar', { length: 50 })
  entityType: string;

  @Column('varchar', { length: 36 })
  entityId: string;

  @Column('simple-json', { nullable: true })
  beforeSnapshot: Record<string, any> | null;

  @Column('simple-json', { nullable: true })
  afterSnapshot: Record<string, any> | null;

  @Column('varchar', { length: 64, nullable: true })
  correlationId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('transactional_outbox')
@Index(['status', 'createdAt'])
export class OutboxTypeOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 50 })
  aggregateType: string;

  @Column('varchar', { length: 36 })
  aggregateId: string;

  @Column('varchar', { length: 80 })
  eventType: string;

  @Column('text')
  payload: string;

  @Column('varchar', { length: 20, default: 'PENDING' })
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';

  @Column('int', { default: 0 })
  retryCount: number;

  @Column('text', { nullable: true })
  lastError: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
