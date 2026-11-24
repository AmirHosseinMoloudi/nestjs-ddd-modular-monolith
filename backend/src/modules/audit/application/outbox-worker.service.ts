import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { AuditService } from './audit.service';
import { MetricsService } from '../../../core/infrastructure/metrics/metrics.service';

@Injectable()
export class OutboxWorkerService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(OutboxWorkerService.name);
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    private readonly auditService: AuditService,
    private readonly metricsService: MetricsService,
  ) {}

  onApplicationBootstrap() {
    this.logger.log('Starting Transactional Outbox Polling Worker...');
    this.timer = setInterval(() => this.processOutboxBatch(), 3000);
  }

  onApplicationShutdown() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  public async processOutboxBatch() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const pending = await this.auditService.fetchPending(20);
      const pendingCount = await this.auditService.getPendingCount();
      this.metricsService.outboxPendingCount.set(pendingCount);

      for (const msg of pending) {
        try {
          // Asynchronously dispatch / project integration event
          // For modular monolith, this bridges to Audit log and external telemetry
          await this.auditService.markPublished(msg.id);
        } catch (err: any) {
          this.logger.error(`Error processing outbox event ${msg.id}: ${err.message}`);
          await this.auditService.markFailed(msg.id, err.message);
        }
      }
    } catch (err: any) {
      this.logger.error(`Outbox worker polling loop error: ${err.message}`);
    } finally {
      this.isProcessing = false;
    }
  }
}
