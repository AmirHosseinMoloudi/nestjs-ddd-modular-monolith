import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskTypeOrmEntity } from './infrastructure/entities/task.typeorm-entities';
import { TaskTypeOrmRepository } from './infrastructure/repositories/task.typeorm-repository';
import { TASK_REPOSITORY_PORT } from './application/ports/task.repository.port';
import { TaskService } from './application/task.service';
import { TaskController } from './presentation/controllers/task.controller';
import { AuditModule } from '../audit/audit.module';
import { IamModule } from '../iam/iam.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskTypeOrmEntity]),
    AuditModule,
    IamModule,
  ],
  controllers: [TaskController],
  providers: [
    TaskService,
    TaskTypeOrmRepository,
    {
      provide: TASK_REPOSITORY_PORT,
      useExisting: TaskTypeOrmRepository,
    },
  ],
  exports: [
    TaskService,
    TASK_REPOSITORY_PORT,
    TypeOrmModule,
  ],
})
export class TaskModule {}
