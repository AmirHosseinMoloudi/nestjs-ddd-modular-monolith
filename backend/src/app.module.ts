import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { IamModule } from './modules/iam/iam.module';
import { TaskModule } from './modules/task/task.module';
import { AuditModule } from './modules/audit/audit.module';
import { MetricsController } from './metrics.controller';
import { HealthController } from './health.controller';
import { HttpExceptionFilter } from './core/infrastructure/filters/http-exception.filter';
import { CorrelationAndMetricsInterceptor } from './core/infrastructure/interceptors/correlation.interceptor';
import { DatabaseSeeder } from './database.seeder';
import { TenantTypeOrmEntity, UserTypeOrmEntity } from './modules/iam/infrastructure/entities/iam.typeorm-entities';
import { TaskTypeOrmEntity } from './modules/task/infrastructure/entities/task.typeorm-entities';
import { AuditLogTypeOrmEntity, OutboxTypeOrmEntity } from './modules/audit/infrastructure/entities/audit.typeorm-entities';

const dbPath = process.env.DATABASE_PATH || './todo.sqlite';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: dbPath,
      entities: [
        TenantTypeOrmEntity,
        UserTypeOrmEntity,
        TaskTypeOrmEntity,
        AuditLogTypeOrmEntity,
        OutboxTypeOrmEntity,
      ],
      synchronize: true, // For development & demo setup; in strict prod use migrations
      logging: false,
    }),
    TypeOrmModule.forFeature([TenantTypeOrmEntity, UserTypeOrmEntity]),
    IamModule,
    TaskModule,
    AuditModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [
    DatabaseSeeder,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationAndMetricsInterceptor,
    },
  ],
})
export class AppModule {}
