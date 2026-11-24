import { Controller, Get, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { MetricsService } from './core/infrastructure/metrics/metrics.service';
import { Public } from './core/infrastructure/security/roles.decorator';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Public()
  @Get()
  async getMetrics(@Res() res: FastifyReply) {
    const metrics = await this.metricsService.getMetrics();
    res.header('Content-Type', this.metricsService.getContentType());
    res.send(metrics);
  }
}
