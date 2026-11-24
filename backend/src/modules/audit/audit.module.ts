import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogTypeOrmEntity, OutboxTypeOrmEntity } from './infrastructure/entities/audit.typeorm-entities';
import { AuditService } from './application/audit.service';
import { OutboxWorkerService } from './application/outbox-worker.service';
import { AuditController } from './presentation/audit.controller';
import { MetricsService } from '../../core/infrastructure/metrics/metrics.service';
import { AUDIT_PORT } from '../../core/application/ports/audit.port';
import { OUTBOX_PORT } from '../../core/application/ports/outbox.port';
import { IamModule } from '../iam/iam.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLogTypeOrmEntity, OutboxTypeOrmEntity]),
    IamModule,
  ],
  controllers: [AuditController],
  providers: [
    AuditService,
    OutboxWorkerService,
    MetricsService,
    {
      provide: AUDIT_PORT,
      useExisting: AuditService,
    },
    {
      provide: OUTBOX_PORT,
      useExisting: AuditService,
    },
  ],
  exports: [
    AuditService,
    OutboxWorkerService,
    MetricsService,
    AUDIT_PORT,
    OUTBOX_PORT,
    TypeOrmModule,
  ],
})
export class AuditModule {}
