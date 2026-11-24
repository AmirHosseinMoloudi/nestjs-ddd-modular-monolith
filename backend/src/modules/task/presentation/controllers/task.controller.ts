import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TaskService } from '../../application/task.service';
import { AuthGuard } from '../../../../core/infrastructure/security/auth.guard';
import { RolesGuard } from '../../../../core/infrastructure/security/roles.guard';
import { RequirePermissions } from '../../../../core/infrastructure/security/roles.decorator';
import { Permission } from '../../../iam/domain/iam.types';
import {
  CreateTaskDto,
  UpdateTaskDto,
  ChangeStatusDto,
  ApproveTaskDto,
  AssignTaskDto,
  AddSubtaskDto,
} from '../dtos/task.dto';
import { TaskPriority, TaskStatus } from '../../domain/task.enums';

@Controller('api/v1/tasks')
@UseGuards(AuthGuard, RolesGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @RequirePermissions(Permission.TASK_CREATE)
  async createTask(@Body() dto: CreateTaskDto, @Req() req: any) {
    const correlationId = req.headers['x-correlation-id'];
    return this.taskService.createTask(dto, req.user, correlationId);
  }

  @Get()
  @RequirePermissions(Permission.TASK_READ)
  async listTasks(
    @Req() req: any,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('assigneeId') assigneeId?: string,
    @Query('creatorId') creatorId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.taskService.listTasks(
      {
        status,
        priority,
        assigneeId,
        creatorId,
        search,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      },
      req.user,
    );
  }

  @Get('stats')
  @RequirePermissions(Permission.TASK_READ)
  async getStats(@Req() req: any) {
    return this.taskService.getTenantStats(req.user);
  }

  @Get(':id')
  @RequirePermissions(Permission.TASK_READ)
  async getTaskById(@Param('id') id: string, @Req() req: any) {
    return this.taskService.getTaskById(id, req.user);
  }

  @Put(':id')
  @RequirePermissions(Permission.TASK_UPDATE)
  async updateTask(@Param('id') id: string, @Body() dto: UpdateTaskDto, @Req() req: any) {
    const correlationId = req.headers['x-correlation-id'];
    return this.taskService.updateTask(id, dto, req.user, correlationId);
  }

  @Put(':id/status')
  @RequirePermissions(Permission.TASK_UPDATE)
  async changeStatus(@Param('id') id: string, @Body() dto: ChangeStatusDto, @Req() req: any) {
    const correlationId = req.headers['x-correlation-id'];
    return this.taskService.changeStatus(id, dto, req.user, correlationId);
  }

  @Post(':id/approve')
  @RequirePermissions(Permission.TASK_APPROVE)
  async approveTask(@Param('id') id: string, @Body() dto: ApproveTaskDto, @Req() req: any) {
    const correlationId = req.headers['x-correlation-id'];
    return this.taskService.approveTask(id, dto, req.user, correlationId);
  }

  @Post(':id/assign')
  @RequirePermissions(Permission.TASK_ASSIGN)
  async assignTask(@Param('id') id: string, @Body() dto: AssignTaskDto, @Req() req: any) {
    const correlationId = req.headers['x-correlation-id'];
    return this.taskService.assignTask(id, dto, req.user, correlationId);
  }

  @Post(':id/subtasks')
  @RequirePermissions(Permission.TASK_UPDATE)
  async addSubtask(@Param('id') id: string, @Body() dto: AddSubtaskDto, @Req() req: any) {
    const correlationId = req.headers['x-correlation-id'];
    return this.taskService.addSubtask(id, dto.title, req.user, correlationId);
  }

  @Put(':id/subtasks/:subtaskId/toggle')
  @RequirePermissions(Permission.TASK_UPDATE)
  async toggleSubtask(
    @Param('id') id: string,
    @Param('subtaskId') subtaskId: string,
    @Req() req: any,
  ) {
    const correlationId = req.headers['x-correlation-id'];
    return this.taskService.toggleSubtask(id, subtaskId, req.user, correlationId);
  }

  @Delete(':id')
  @RequirePermissions(Permission.TASK_DELETE)
  async deleteTask(@Param('id') id: string, @Req() req: any) {
    const correlationId = req.headers['x-correlation-id'];
    return this.taskService.deleteTask(id, req.user, correlationId);
  }
}
