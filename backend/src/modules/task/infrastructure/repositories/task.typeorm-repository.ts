import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { TaskTypeOrmEntity } from '../entities/task.typeorm-entities';
import { ITaskRepositoryPort, TaskQueryFilters, PaginatedResult } from '../../application/ports/task.repository.port';
import { TaskAggregate } from '../../domain/task.aggregate';
import { TaskPriority, TaskStatus, ApprovalStatus } from '../../domain/task.enums';

@Injectable()
export class TaskTypeOrmRepository implements ITaskRepositoryPort {
  constructor(
    @InjectRepository(TaskTypeOrmEntity)
    private readonly repo: Repository<TaskTypeOrmEntity>,
  ) {}

  public async save(task: TaskAggregate): Promise<void> {
    const entity = this.repo.create({
      id: task.id,
      tenantId: task.tenantId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      creatorId: task.creatorId,
      assigneeId: task.assigneeId || null,
      assigneeEmail: task.assigneeEmail || null,
      requiresApproval: task.requiresApproval,
      approvalStatus: task.approvalStatus,
      approvedById: task.approvedById || null,
      approvalComment: task.approvalComment || null,
      tags: [...task.tags],
      subtasks: [...task.subtasks],
      deadline: task.deadline || null,
      version: task.version,
      updatedAt: task.updatedAt,
      createdAt: task.createdAt,
    });

    await this.repo.save(entity);
  }

  public async findById(id: string, tenantId: string): Promise<TaskAggregate | null> {
    const entity = await this.repo.findOne({
      where: { id, tenantId },
    });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  public async findPaginated(filters: TaskQueryFilters): Promise<PaginatedResult<TaskAggregate>> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repo.createQueryBuilder('task')
      .where('task.tenantId = :tenantId', { tenantId: filters.tenantId });

    if (filters.status) {
      queryBuilder.andWhere('task.status = :status', { status: filters.status });
    }
    if (filters.priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority: filters.priority });
    }
    if (filters.assigneeId) {
      queryBuilder.andWhere('task.assigneeId = :assigneeId', { assigneeId: filters.assigneeId });
    }
    if (filters.creatorId) {
      queryBuilder.andWhere('task.creatorId = :creatorId', { creatorId: filters.creatorId });
    }
    if (filters.search) {
      queryBuilder.andWhere('(task.title LIKE :search OR task.description LIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    queryBuilder.orderBy('task.createdAt', 'DESC');
    queryBuilder.skip(skip).take(limit);

    const [entities, total] = await queryBuilder.getManyAndCount();

    return {
      items: entities.map((e) => this.toDomain(e)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async delete(id: string, tenantId: string): Promise<void> {
    await this.repo.delete({ id, tenantId });
  }

  public async countByTenant(tenantId: string): Promise<{ total: number; byStatus: Record<string, number> }> {
    const total = await this.repo.count({ where: { tenantId } });
    const tasks = await this.repo.find({ where: { tenantId }, select: ['status'] });
    const byStatus: Record<string, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const t of tasks) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    }
    return { total, byStatus };
  }

  private toDomain(entity: TaskTypeOrmEntity): TaskAggregate {
    return TaskAggregate.reconstitute({
      id: entity.id,
      tenantId: entity.tenantId,
      title: entity.title,
      description: entity.description,
      priority: entity.priority as TaskPriority,
      status: entity.status as TaskStatus,
      creatorId: entity.creatorId,
      assigneeId: entity.assigneeId,
      assigneeEmail: entity.assigneeEmail,
      requiresApproval: entity.requiresApproval,
      approvalStatus: entity.approvalStatus as ApprovalStatus,
      approvedById: entity.approvedById,
      approvalComment: entity.approvalComment,
      tags: entity.tags || [],
      subtasks: entity.subtasks || [],
      deadline: entity.deadline ? new Date(entity.deadline) : null,
      version: entity.version,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
