import { TaskAggregate } from '../../domain/task.aggregate';
import { TaskPriority, TaskStatus } from '../../domain/task.enums';

export interface TaskQueryFilters {
  tenantId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  creatorId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ITaskRepositoryPort {
  save(task: TaskAggregate): Promise<void>;
  findById(id: string, tenantId: string): Promise<TaskAggregate | null>;
  findPaginated(filters: TaskQueryFilters): Promise<PaginatedResult<TaskAggregate>>;
  delete(id: string, tenantId: string): Promise<void>;
  countByTenant(tenantId: string): Promise<{ total: number; byStatus: Record<string, number> }>;
}

export const TASK_REPOSITORY_PORT = Symbol('ITaskRepositoryPort');
