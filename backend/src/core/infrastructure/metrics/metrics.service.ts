import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: client.Registry;

  public httpRequestsTotal: client.Counter;
  public httpRequestDuration: client.Histogram;
  public tasksTotal: client.Gauge;
  public domainEventsTotal: client.Counter;
  public outboxPendingCount: client.Gauge;
  public auditRecordsTotal: client.Counter;

  constructor() {
    this.registry = new client.Registry();
    client.collectDefaultMetrics({ register: this.registry, prefix: 'todo_app_' });

    this.httpRequestsTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests processed',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
      registers: [this.registry],
    });

    this.tasksTotal = new client.Gauge({
      name: 'todo_tasks_total',
      help: 'Current count of tasks across the system',
      labelNames: ['status', 'priority'],
      registers: [this.registry],
    });

    this.domainEventsTotal = new client.Counter({
      name: 'todo_domain_events_dispatched_total',
      help: 'Total domain events dispatched',
      labelNames: ['event_name', 'aggregate_type'],
      registers: [this.registry],
    });

    this.outboxPendingCount = new client.Gauge({
      name: 'todo_outbox_pending_count',
      help: 'Current pending messages in transactional outbox',
      registers: [this.registry],
    });

    this.auditRecordsTotal = new client.Counter({
      name: 'todo_audit_records_total',
      help: 'Total audit records inserted into immutable log',
      labelNames: ['action', 'entity_type'],
      registers: [this.registry],
    });
  }

  onModuleInit() {}

  public async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  public getContentType(): string {
    return this.registry.contentType;
  }
}
