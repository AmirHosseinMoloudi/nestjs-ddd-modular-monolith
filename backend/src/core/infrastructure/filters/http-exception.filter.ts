import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: (exception as Error)?.message || 'Internal server error' };

    const correlationId = (request.headers['x-correlation-id'] as string) || crypto.randomUUID();

    const errorDetails = typeof exceptionResponse === 'object' ? exceptionResponse : { message: exceptionResponse };

    this.logger.error(
      `[${correlationId}] HTTP ${status} error on ${request.method} ${request.url}: ${JSON.stringify(errorDetails)}`,
      (exception as Error)?.stack,
    );

    // RFC 7807 Problem Details representation
    response.status(status).send({
      type: `https://httpstatuses.com/${status}`,
      title: (exception as any)?.name || 'Application Error',
      status,
      detail: (errorDetails as any).message || 'An unexpected domain or system error occurred',
      instance: request.url,
      correlationId,
      timestamp: new Date().toISOString(),
    });
  }
}
