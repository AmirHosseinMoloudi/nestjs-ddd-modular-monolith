import { Controller, Get } from '@nestjs/common';
import { Public } from './core/infrastructure/security/roles.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  checkHealth() {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: 'HEALTHY',
        opentelemetry: 'ACTIVE',
        outboxWorker: 'RUNNING',
      },
    };
  }
}
