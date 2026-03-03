import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '@domain/errors';

interface ErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  timestamp: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let errorResponse: ErrorResponse;

    if (exception instanceof DomainError) {
      errorResponse = {
        statusCode: exception.statusCode,
        code: exception.code,
        message: exception.message,
        timestamp: new Date().toISOString(),
      };
    } else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message;

      errorResponse = {
        statusCode: status,
        code: `HTTP_${status}`,
        message: Array.isArray(message) ? message.join(', ') : message,
        timestamp: new Date().toISOString(),
      };
    } else {
      this.logger.error('Unhandled exception', exception);
      errorResponse = {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Error interno del servidor',
        timestamp: new Date().toISOString(),
      };
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }
}
