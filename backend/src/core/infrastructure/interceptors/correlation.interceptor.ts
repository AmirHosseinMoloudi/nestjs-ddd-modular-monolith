import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../metrics/metrics.service';
import { TenantContextHolder } from '../security/tenant.context';

@Injectable()
export class CorrelationAndMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    let correlationId = request.headers['x-correlation-id'];
    if (!correlationId) {
      correlationId = crypto.randomUUID();
      request.headers['x-correlation-id'] = correlationId;
    }
    response.header('x-correlation-id', correlationId);

    const startTime = Date.now();
    const method = request.method;
    const route = request.routeOptions?.url || request.url;

    // Run inside TenantContext if user is authenticated
    if (request.user) {
      return new Observable((subscriber) => {
        TenantContextHolder.runWithContext(request.user, () => {
          next
            .handle()
            .pipe(
              tap({
                next: () => {
                  const duration = (Date.now() - startTime) / 1000;
                  const statusCode = response.statusCode ? String(response.statusCode) : '200';
                  this.metricsService.httpRequestsTotal.inc({ method, route, status_code: statusCode });
                  this.metricsService.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
                },
                error: (err) => {
                  const duration = (Date.now() - startTime) / 1000;
                  const statusCode = err.status ? String(err.status) : '500';
                  this.metricsService.httpRequestsTotal.inc({ method, route, status_code: statusCode });
                  this.metricsService.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
                },
              }),
            )
            .subscribe(subscriber);
        });
      });
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - startTime) / 1000;
          const statusCode = response.statusCode ? String(response.statusCode) : '200';
          this.metricsService.httpRequestsTotal.inc({ method, route, status_code: statusCode });
          this.metricsService.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
        },
        error: (err) => {
          const duration = (Date.now() - startTime) / 1000;
          const statusCode = err.status ? String(err.status) : '500';
          this.metricsService.httpRequestsTotal.inc({ method, route, status_code: statusCode });
          this.metricsService.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
        },
      }),
    );
  }
}
