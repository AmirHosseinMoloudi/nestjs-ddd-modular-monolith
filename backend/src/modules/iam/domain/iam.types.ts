export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
  AUDITOR = 'AUDITOR',
}

export enum Permission {
  TASK_READ = 'task:read',
  TASK_CREATE = 'task:create',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  TASK_APPROVE = 'task:approve',
  TASK_ASSIGN = 'task:assign',
  AUDIT_READ = 'audit:read',
  TENANT_MANAGE = 'tenant:manage',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.TASK_READ,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_APPROVE,
    Permission.TASK_ASSIGN,
    Permission.AUDIT_READ,
    Permission.TENANT_MANAGE,
  ],
  [UserRole.MANAGER]: [
    Permission.TASK_READ,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_APPROVE,
    Permission.TASK_ASSIGN,
    Permission.AUDIT_READ,
  ],
  [UserRole.USER]: [
    Permission.TASK_READ,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
  ],
  [UserRole.AUDITOR]: [
    Permission.TASK_READ,
    Permission.AUDIT_READ,
  ],
};
