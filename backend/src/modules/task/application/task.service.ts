import { Injectable, Inject, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { TASK_REPOSITORY_PORT, ITaskRepositoryPort, TaskQueryFilters } from '../application/ports/task.repository.port';
import { OUTBOX_PORT, IOutboxPort } from '../../../core/application/ports/outbox.port';
import { AUDIT_PORT, IAuditPort } from '../../../core/application/ports/audit.port';
import { TaskAggregate } from '../domain/task.aggregate';
import { TaskPriority, TaskStatus } from '../domain/task.enums';
import { UserContext } from '../../../core/infrastructure/security/tenant.context';
import { MetricsService } from '../../../core/infrastructure/metrics/metrics.service';
import { CreateTaskDto, UpdateTaskDto, ChangeStatusDto, ApproveTaskDto, AssignTaskDto } from '../presentation/dtos/task.dto';

@Injectable()
export class TaskService {
  constructor(
    @Inject(TASK_REPOSITORY_PORT)
    private readonly taskRepo: ITaskRepositoryPort,
    @Inject(OUTBOX_PORT)
    private readonly outbox: IOutboxPort,
    @Inject(AUDIT_PORT)
    private readonly audit: IAuditPort,
    private readonly metricsService: MetricsService,
  ) {}

  public async createTask(dto: CreateTaskDto, user: UserContext, correlationId?: string) {
    const task = TaskAggregate.create(
      {
        tenantId: user.tenantId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        creatorId: user.userId,
        assigneeId: dto.assigneeId,
        assigneeEmail: dto.assigneeEmail,
        requiresApproval: dto.requiresApproval,
        tags: dto.tags,
        subtasks: dto.subtasks,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
      },
      correlationId,
    );

    await this.taskRepo.save(task);

    // Transactional Outbox pattern
    for (const evt of task.domainEvents) {
      await this.outbox.storeMessage({
        id: evt.eventId,
        aggregateType: evt.aggregateType,
        aggregateId: evt.aggregateId,
        eventType: evt.eventName,
        payload: JSON.stringify(evt.payload),
        occurredOn: evt.occurredOn,
      });
    }

    // Append-only Audit Trail
    await this.audit.recordAudit({
      tenantId: user.tenantId,
      actorId: user.userId,
      actorEmail: user.email,
      action: 'TASK_CREATED',
      entityType: 'Task',
      entityId: task.id,
      beforeSnapshot: null,
      afterSnapshot: this.toSnapshot(task),
      correlationId,
    });

    task.clearDomainEvents();
    return this.toResponse(task);
  }

  public async updateTask(id: string, dto: UpdateTaskDto, user: UserContext, correlationId?: string) {
    const task = await this.taskRepo.findById(id, user.tenantId);
    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    const beforeSnapshot = this.toSnapshot(task);

    try {
      task.updateDetails({
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        tags: dto.tags,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        expectedVersion: dto.expectedVersion,
      });
    } catch (err: any) {
      if (err.message.includes('Optimistic concurrency conflict')) {
        throw new ConflictException(err.message);
      }
      throw new BadRequestException(err.message);
    }

    await this.taskRepo.save(task);

    await this.audit.recordAudit({
      tenantId: user.tenantId,
      actorId: user.userId,
      actorEmail: user.email,
      action: 'TASK_UPDATED',
      entityType: 'Task',
      entityId: task.id,
      beforeSnapshot,
      afterSnapshot: this.toSnapshot(task),
      correlationId,
    });

    return this.toResponse(task);
  }

  public async changeStatus(id: string, dto: ChangeStatusDto, user: UserContext, correlationId?: string) {
    const task = await this.taskRepo.findById(id, user.tenantId);
    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    const beforeSnapshot = this.toSnapshot(task);

    try {
      task.transitionTo(dto.status, user.userId, correlationId);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }

    await this.taskRepo.save(task);

    for (const evt of task.domainEvents) {
      await this.outbox.storeMessage({
        id: evt.eventId,
        aggregateType: evt.aggregateType,
        aggregateId: evt.aggregateId,
        eventType: evt.eventName,
        payload: JSON.stringify(evt.payload),
        occurredOn: evt.occurredOn,
      });
    }

    await this.audit.recordAudit({
      tenantId: user.tenantId,
      actorId: user.userId,
      actorEmail: user.email,
      action: `TASK_STATUS_CHANGED_TO_${dto.status}`,
      entityType: 'Task',
      entityId: task.id,
      beforeSnapshot,
      afterSnapshot: this.toSnapshot(task),
      correlationId,
    });

    task.clearDomainEvents();
    return this.toResponse(task);
  }

  public async approveTask(id: string, dto: ApproveTaskDto, user: UserContext, correlationId?: string) {
    const task = await this.taskRepo.findById(id, user.tenantId);
    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    const beforeSnapshot = this.toSnapshot(task);

    try {
      task.processApproval(user.userId, dto.decision, dto.comments, correlationId);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }

    await this.taskRepo.save(task);

    for (const evt of task.domainEvents) {
      await this.outbox.storeMessage({
        id: evt.eventId,
        aggregateType: evt.aggregateType,
        aggregateId: evt.aggregateId,
        eventType: evt.eventName,
        payload: JSON.stringify(evt.payload),
        occurredOn: evt.occurredOn,
      });
    }

    await this.audit.recordAudit({
      tenantId: user.tenantId,
      actorId: user.userId,
      actorEmail: user.email,
      action: `TASK_APPROVAL_${dto.decision}`,
      entityType: 'Task',
      entityId: task.id,
      beforeSnapshot,
      afterSnapshot: this.toSnapshot(task),
      correlationId,
    });

    task.clearDomainEvents();
    return this.toResponse(task);
  }

  public async assignTask(id: string, dto: AssignTaskDto, user: UserContext, correlationId?: string) {
    const task = await this.taskRepo.findById(id, user.tenantId);
    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    const beforeSnapshot = this.toSnapshot(task);

    task.assignTo(dto.assigneeId, dto.assigneeEmail, user.userId, correlationId);
    await this.taskRepo.save(task);

    for (const evt of task.domainEvents) {
      await this.outbox.storeMessage({
        id: evt.eventId,
        aggregateType: evt.aggregateType,
        aggregateId: evt.aggregateId,
        eventType: evt.eventName,
        payload: JSON.stringify(evt.payload),
        occurredOn: evt.occurredOn,
      });
    }

    await this.audit.recordAudit({
      tenantId: user.tenantId,
      actorId: user.userId,
      actorEmail: user.email,
      action: 'TASK_ASSIGNED',
      entityType: 'Task',
      entityId: task.id,
      beforeSnapshot,
      afterSnapshot: this.toSnapshot(task),
      correlationId,
    });

    task.clearDomainEvents();
    return this.toResponse(task);
  }

  public async toggleSubtask(id: string, subtaskId: string, user: UserContext, correlationId?: string) {
    const task = await this.taskRepo.findById(id, user.tenantId);
    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    task.toggleSubtask(subtaskId);
    await this.taskRepo.save(task);

    await this.audit.recordAudit({
      tenantId: user.tenantId,
      actorId: user.userId,
      actorEmail: user.email,
      action: 'TASK_SUBTASK_TOGGLED',
      entityType: 'Task',
      entityId: task.id,
      beforeSnapshot: null,
      afterSnapshot: this.toSnapshot(task),
      correlationId,
    });

    return this.toResponse(task);
  }

  public async addSubtask(id: string, title: string, user: UserContext, correlationId?: string) {
    const task = await this.taskRepo.findById(id, user.tenantId);
    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    task.addSubtask(title);
    await this.taskRepo.save(task);

    await this.audit.recordAudit({
      tenantId: user.tenantId,
      actorId: user.userId,
      actorEmail: user.email,
      action: 'TASK_SUBTASK_ADDED',
      entityType: 'Task',
      entityId: task.id,
      beforeSnapshot: null,
      afterSnapshot: this.toSnapshot(task),
      correlationId,
    });

    return this.toResponse(task);
  }

  public async deleteTask(id: string, user: UserContext, correlationId?: string) {
    const task = await this.taskRepo.findById(id, user.tenantId);
    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    const beforeSnapshot = this.toSnapshot(task);
    await this.taskRepo.delete(id, user.tenantId);

    await this.audit.recordAudit({
      tenantId: user.tenantId,
      actorId: user.userId,
      actorEmail: user.email,
      action: 'TASK_DELETED',
      entityType: 'Task',
      entityId: id,
      beforeSnapshot,
      afterSnapshot: null,
      correlationId,
    });

    return { message: 'Task deleted successfully', id };
  }

  public async getTaskById(id: string, user: UserContext) {
    const task = await this.taskRepo.findById(id, user.tenantId);
    if (!task) {
      throw new NotFoundException('Task not found.');
    }
    return this.toResponse(task);
  }

  public async listTasks(filters: Omit<TaskQueryFilters, 'tenantId'>, user: UserContext) {
    const paginated = await this.taskRepo.findPaginated({
      ...filters,
      tenantId: user.tenantId,
    });

    return {
      items: paginated.items.map((t) => this.toResponse(t)),
      total: paginated.total,
      page: paginated.page,
      limit: paginated.limit,
      totalPages: paginated.totalPages,
    };
  }

  public async getTenantStats(user: UserContext) {
    const counts = await this.taskRepo.countByTenant(user.tenantId);
    for (const [status, count] of Object.entries(counts.byStatus)) {
      this.metricsService.tasksTotal.set({ status, priority: 'ALL' }, count);
    }
    return counts;
  }

  private toSnapshot(task: TaskAggregate): Record<string, any> {
    return {
      id: task.id,
      tenantId: task.tenantId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      creatorId: task.creatorId,
      assigneeId: task.assigneeId,
      assigneeEmail: task.assigneeEmail,
      requiresApproval: task.requiresApproval,
      approvalStatus: task.approvalStatus,
      approvedById: task.approvedById,
      approvalComment: task.approvalComment,
      tags: [...task.tags],
      subtasks: [...task.subtasks],
      deadline: task.deadline ? task.deadline.toISOString() : null,
      version: task.version,
    };
  }

  private toResponse(task: TaskAggregate) {
    return {
      id: task.id,
      tenantId: task.tenantId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      creatorId: task.creatorId,
      assigneeId: task.assigneeId,
      assigneeEmail: task.assigneeEmail,
      requiresApproval: task.requiresApproval,
      approvalStatus: task.approvalStatus,
      approvedById: task.approvedById,
      approvalComment: task.approvalComment,
      tags: task.tags,
      subtasks: task.subtasks,
      deadline: task.deadline ? task.deadline.toISOString() : null,
      version: task.version,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
