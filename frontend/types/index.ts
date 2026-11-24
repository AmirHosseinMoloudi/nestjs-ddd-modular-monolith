export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
export type ApprovalStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  creatorId: string;
  assigneeId?: string | null;
  assigneeEmail?: string | null;
  requiresApproval: boolean;
  approvalStatus: ApprovalStatus;
  approvedById?: string | null;
  approvalComment?: string | null;
  tags: string[];
  subtasks: Subtask[];
  deadline?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'USER' | 'AUDITOR';
  tenantId: string;
  permissions: string[];
}

export interface AuditRecord {
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
  timestamp: string;
}
