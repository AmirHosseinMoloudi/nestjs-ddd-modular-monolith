import { AggregateRoot } from '../../../core/domain/entity.base';
import { TaskPriority, TaskStatus, ApprovalStatus, SubtaskProps } from './task.enums';
import {
  TaskCreatedDomainEvent,
  TaskStatusChangedDomainEvent,
  TaskAssignedDomainEvent,
  TaskApprovedDomainEvent,
} from './task.events';

export interface TaskAggregateProps {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
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
  subtasks: SubtaskProps[];
  deadline?: Date | null;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TaskAggregate extends AggregateRoot<string> {
  private _tenantId: string;
  private _title: string;
  private _description: string;
  private _priority: TaskPriority;
  private _status: TaskStatus;
  private _creatorId: string;
  private _assigneeId?: string | null;
  private _assigneeEmail?: string | null;
  private _requiresApproval: boolean;
  private _approvalStatus: ApprovalStatus;
  private _approvedById?: string | null;
  private _approvalComment?: string | null;
  private _tags: string[];
  private _subtasks: SubtaskProps[];
  private _deadline?: Date | null;

  private constructor(props: TaskAggregateProps) {
    super(props.id, props.version, props.createdAt, props.updatedAt);
    this._tenantId = props.tenantId;
    this._title = props.title;
    this._description = props.description || '';
    this._priority = props.priority;
    this._status = props.status;
    this._creatorId = props.creatorId;
    this._assigneeId = props.assigneeId;
    this._assigneeEmail = props.assigneeEmail;
    this._requiresApproval = props.requiresApproval;
    this._approvalStatus = props.approvalStatus;
    this._approvedById = props.approvedById;
    this._approvalComment = props.approvalComment;
    this._tags = props.tags || [];
    this._subtasks = props.subtasks || [];
    this._deadline = props.deadline;
  }

  public static create(
    params: {
      tenantId: string;
      title: string;
      description?: string;
      priority: TaskPriority;
      creatorId: string;
      assigneeId?: string | null;
      assigneeEmail?: string | null;
      requiresApproval?: boolean;
      tags?: string[];
      subtasks?: { title: string }[];
      deadline?: Date | null;
    },
    correlationId?: string,
  ): TaskAggregate {
    if (!params.title || params.title.trim().length === 0) {
      throw new Error('Task title cannot be empty.');
    }
    if (params.title.trim().length > 150) {
      throw new Error('Task title cannot exceed 150 characters.');
    }

    const id = crypto.randomUUID();
    // Invariant: CRITICAL tasks enforce approval workflow (Maker-Checker policy)
    const requiresApproval = params.priority === TaskPriority.CRITICAL ? true : !!params.requiresApproval;

    const subtasks: SubtaskProps[] = (params.subtasks || []).map((s) => ({
      id: crypto.randomUUID(),
      title: s.title.trim(),
      isCompleted: false,
    }));

    const task = new TaskAggregate({
      id,
      tenantId: params.tenantId,
      title: params.title.trim(),
      description: params.description?.trim() || '',
      priority: params.priority,
      status: TaskStatus.TODO,
      creatorId: params.creatorId,
      assigneeId: params.assigneeId || null,
      assigneeEmail: params.assigneeEmail || null,
      requiresApproval,
      approvalStatus: requiresApproval ? ApprovalStatus.PENDING : ApprovalStatus.NONE,
      approvedById: null,
      approvalComment: null,
      tags: params.tags || [],
      subtasks,
      deadline: params.deadline || null,
      version: 1,
    });

    task.addDomainEvent(
      new TaskCreatedDomainEvent(
        task.id,
        {
          tenantId: task._tenantId,
          title: task._title,
          priority: task._priority,
          creatorId: task._creatorId,
          requiresApproval: task._requiresApproval,
          deadline: task._deadline?.toISOString() || null,
        },
        correlationId,
      ),
    );

    return task;
  }

  public static reconstitute(props: TaskAggregateProps): TaskAggregate {
    return new TaskAggregate(props);
  }

  // Getters
  public get tenantId(): string { return this._tenantId; }
  public get title(): string { return this._title; }
  public get description(): string { return this._description; }
  public get priority(): TaskPriority { return this._priority; }
  public get status(): TaskStatus { return this._status; }
  public get creatorId(): string { return this._creatorId; }
  public get assigneeId(): string | null | undefined { return this._assigneeId; }
  public get assigneeEmail(): string | null | undefined { return this._assigneeEmail; }
  public get requiresApproval(): boolean { return this._requiresApproval; }
  public get approvalStatus(): ApprovalStatus { return this._approvalStatus; }
  public get approvedById(): string | null | undefined { return this._approvedById; }
  public get approvalComment(): string | null | undefined { return this._approvalComment; }
  public get tags(): ReadonlyArray<string> { return [...this._tags]; }
  public get subtasks(): ReadonlyArray<SubtaskProps> { return [...this._subtasks]; }
  public get deadline(): Date | null | undefined { return this._deadline; }

  // State Transition Machine (FSM)
  public transitionTo(newStatus: TaskStatus, actorId: string, correlationId?: string): void {
    if (this._status === TaskStatus.COMPLETED || this._status === TaskStatus.CANCELLED) {
      throw new Error(`Cannot transition task in terminal status ${this._status}.`);
    }

    if (newStatus === this._status) {
      return;
    }

    // FSM rules
    if (newStatus === TaskStatus.COMPLETED) {
      if (this._requiresApproval && this._approvalStatus !== ApprovalStatus.APPROVED) {
        throw new Error('Task requires prior manager approval before completing.');
      }
    }

    if (newStatus === TaskStatus.IN_REVIEW) {
      if (!this._requiresApproval) {
        throw new Error('Cannot put task in review: approval is not required.');
      }
    }

    const previousStatus = this._status;
    this._status = newStatus;
    this.incrementVersion();

    this.addDomainEvent(
      new TaskStatusChangedDomainEvent(
        this.id,
        {
          tenantId: this._tenantId,
          fromStatus: previousStatus,
          toStatus: newStatus,
          actorId,
          version: this.version,
        },
        correlationId,
      ),
    );
  }

  // Maker-Checker Approval
  public processApproval(
    approverId: string,
    decision: 'APPROVED' | 'REJECTED',
    comments?: string,
    correlationId?: string,
  ): void {
    if (!this._requiresApproval) {
      throw new Error('This task does not require formal approval.');
    }

    // Strict Maker-Checker Invariant
    if (approverId === this._creatorId) {
      throw new Error('Maker-Checker Violation: Task creator cannot approve their own task.');
    }
    if (this._assigneeId && approverId === this._assigneeId) {
      throw new Error('Maker-Checker Violation: Task assignee cannot approve their own task.');
    }

    this._approvalStatus = decision === 'APPROVED' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;
    this._approvedById = approverId;
    this._approvalComment = comments || null;

    if (decision === 'APPROVED' && this._status === TaskStatus.IN_REVIEW) {
      this._status = TaskStatus.COMPLETED;
    } else if (decision === 'REJECTED' && this._status === TaskStatus.IN_REVIEW) {
      this._status = TaskStatus.IN_PROGRESS;
    }

    this.incrementVersion();

    this.addDomainEvent(
      new TaskApprovedDomainEvent(
        this.id,
        {
          tenantId: this._tenantId,
          approverId,
          decision,
          comments,
        },
        correlationId,
      ),
    );
  }

  public assignTo(assigneeId: string, assigneeEmail: string, actorId: string, correlationId?: string): void {
    this._assigneeId = assigneeId;
    this._assigneeEmail = assigneeEmail;
    this.incrementVersion();

    this.addDomainEvent(
      new TaskAssignedDomainEvent(
        this.id,
        {
          tenantId: this._tenantId,
          assigneeId,
          assigneeEmail,
          actorId,
        },
        correlationId,
      ),
    );
  }

  public updateDetails(
    params: {
      title?: string;
      description?: string;
      priority?: TaskPriority;
      tags?: string[];
      deadline?: Date | null;
      expectedVersion: number;
    },
  ): void {
    // Optimistic Concurrency Control (OCC) Check
    if (params.expectedVersion !== this._version) {
      throw new Error(
        `Optimistic concurrency conflict: Aggregate version is ${this._version}, expected ${params.expectedVersion}. Please reload and retry.`,
      );
    }

    if (params.title !== undefined) {
      if (!params.title || params.title.trim().length === 0) {
        throw new Error('Task title cannot be empty.');
      }
      this._title = params.title.trim();
    }

    if (params.description !== undefined) {
      this._description = params.description.trim();
    }

    if (params.priority !== undefined) {
      this._priority = params.priority;
      if (params.priority === TaskPriority.CRITICAL && !this._requiresApproval) {
        this._requiresApproval = true;
        this._approvalStatus = ApprovalStatus.PENDING;
      }
    }

    if (params.tags !== undefined) {
      this._tags = params.tags;
    }

    if (params.deadline !== undefined) {
      this._deadline = params.deadline;
    }

    this.incrementVersion();
  }

  public toggleSubtask(subtaskId: string): void {
    const subtask = this._subtasks.find((s) => s.id === subtaskId);
    if (!subtask) {
      throw new Error('Subtask not found in aggregate.');
    }
    subtask.isCompleted = !subtask.isCompleted;
    this.incrementVersion();
  }

  public addSubtask(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Subtask title cannot be empty.');
    }
    this._subtasks.push({
      id: crypto.randomUUID(),
      title: title.trim(),
      isCompleted: false,
    });
    this.incrementVersion();
  }
}
