export interface AuditLogRecord {
  id: string;
  tenantId: string;
  actorId: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeSnapshot?: Record<string, any> | null;
  afterSnapshot?: Record<string, any> | null;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface IAuditPort {
  recordAudit(record: Omit<AuditLogRecord, 'id' | 'timestamp'>): Promise<void>;
  queryAuditTrail(tenantId: string, entityId?: string, limit?: number): Promise<AuditLogRecord[]>;
}

export const AUDIT_PORT = Symbol('AUDIT_PORT');
