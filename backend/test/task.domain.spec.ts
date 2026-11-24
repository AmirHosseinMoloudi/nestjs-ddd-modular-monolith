import * as assert from 'node:assert';
import test, { describe, it } from 'node:test';
import { TaskAggregate } from '../src/modules/task/domain/task.aggregate';
import { TaskPriority, TaskStatus, ApprovalStatus } from '../src/modules/task/domain/task.enums';

describe('Task Domain Model & Invariants', () => {
  const tenantId = 'test-tenant-1';
  const creatorId = 'user-creator';
  const managerId = 'user-manager';
  const assigneeId = 'user-assignee';

  it('enforces title validation and auto-enables approval workflow for CRITICAL priority', () => {
    assert.throws(() => {
      TaskAggregate.create({
        tenantId,
        title: '',
        priority: TaskPriority.LOW,
        creatorId,
      });
    }, /Task title cannot be empty/);

    const criticalTask = TaskAggregate.create({
      tenantId,
      title: 'Fix Production Vulnerability',
      priority: TaskPriority.CRITICAL,
      creatorId,
      requiresApproval: false, // Invariant overrides this to true
    });

    assert.strictEqual(criticalTask.requiresApproval, true);
    assert.strictEqual(criticalTask.approvalStatus, ApprovalStatus.PENDING);
    assert.strictEqual(criticalTask.status, TaskStatus.TODO);
  });

  it('prevents direct transition to COMPLETED if task requires unapproved signoff', () => {
    const task = TaskAggregate.create({
      tenantId,
      title: 'Audited Financial Migration',
      priority: TaskPriority.HIGH,
      creatorId,
      requiresApproval: true,
    });

    // Move to IN_PROGRESS
    task.transitionTo(TaskStatus.IN_PROGRESS, creatorId);
    assert.strictEqual(task.status, TaskStatus.IN_PROGRESS);

    // Attempting direct completion without approval must fail invariant
    assert.throws(() => {
      task.transitionTo(TaskStatus.COMPLETED, creatorId);
    }, /Task requires prior manager approval before completing/);
  });

  it('strictly enforces Maker-Checker separation of duties (creator/assignee cannot self-approve)', () => {
    const task = TaskAggregate.create({
      tenantId,
      title: 'Deploy New Gateway Route',
      priority: TaskPriority.CRITICAL,
      creatorId,
      assigneeId,
    });

    task.transitionTo(TaskStatus.IN_PROGRESS, creatorId);
    task.transitionTo(TaskStatus.IN_REVIEW, creatorId);

    // Creator self-approval must fail
    assert.throws(() => {
      task.processApproval(creatorId, 'APPROVED', 'Self approving');
    }, /Maker-Checker Violation: Task creator cannot approve their own task/);

    // Assignee self-approval must fail
    assert.throws(() => {
      task.processApproval(assigneeId, 'APPROVED', 'Assignee approving');
    }, /Maker-Checker Violation: Task assignee cannot approve their own task/);

    // Independent manager approval succeeds
    task.processApproval(managerId, 'APPROVED', 'Reviewed and approved');
    assert.strictEqual(task.approvalStatus, ApprovalStatus.APPROVED);
    assert.strictEqual(task.status, TaskStatus.COMPLETED);
    assert.strictEqual(task.approvedById, managerId);
  });

  it('enforces Optimistic Concurrency Control (OCC) version tokens', () => {
    const task = TaskAggregate.create({
      tenantId,
      title: 'Initial Version Title',
      priority: TaskPriority.LOW,
      creatorId,
    });

    const currentVersion = task.version;

    // Successful update with matching version
    task.updateDetails({
      title: 'Updated Title V2',
      expectedVersion: currentVersion,
    });

    assert.strictEqual(task.version, currentVersion + 1);

    // Concurrent conflicting update with stale version
    assert.throws(() => {
      task.updateDetails({
        title: 'Concurrent Stale Update',
        expectedVersion: currentVersion, // Stale!
      });
    }, /Optimistic concurrency conflict/);
  });
});
