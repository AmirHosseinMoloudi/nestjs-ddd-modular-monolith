import { IsNotEmpty, IsEnum, IsOptional, IsArray, IsDateString, IsInt, Min } from 'class-validator';
import { TaskPriority, TaskStatus } from '../../domain/task.enums';

export class CreateTaskDto {
  @IsNotEmpty()
  title: string;

  @IsOptional()
  description?: string;

  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @IsOptional()
  assigneeId?: string;

  @IsOptional()
  assigneeEmail?: string;

  @IsOptional()
  requiresApproval?: boolean;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsArray()
  subtasks?: { title: string }[];

  @IsOptional()
  @IsDateString()
  deadline?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  title?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsInt()
  @Min(1)
  expectedVersion: number;
}

export class ChangeStatusDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;
}

export class ApproveTaskDto {
  @IsEnum(['APPROVED', 'REJECTED'])
  decision: 'APPROVED' | 'REJECTED';

  @IsOptional()
  comments?: string;
}

export class AssignTaskDto {
  @IsNotEmpty()
  assigneeId: string;

  @IsNotEmpty()
  assigneeEmail: string;
}

export class AddSubtaskDto {
  @IsNotEmpty()
  title: string;
}
