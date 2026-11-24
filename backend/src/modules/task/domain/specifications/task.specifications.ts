import { CompositeSpecification } from '../../../../core/domain/specification';
import { TaskAggregate } from '../task.aggregate';
import { TaskStatus, ApprovalStatus } from '../task.enums';

export class CanCompleteTaskSpecification extends CompositeSpecification<TaskAggregate> {
  isSatisfiedBy(task: TaskAggregate): boolean {
    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      return false;
    }
    if (task.requiresApproval && task.approvalStatus !== ApprovalStatus.APPROVED) {
      return false;
    }
    return true;
  }
}

export class MakerCheckerSpecification {
  public static canApprove(task: TaskAggregate, approverId: string): boolean {
    if (!task.requiresApproval) {
      return false;
    }
    if (task.creatorId === approverId) {
      return false;
    }
    if (task.assigneeId && task.assigneeId === approverId) {
      return false;
    }
    return true;
  }
}
