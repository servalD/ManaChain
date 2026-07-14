import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as Sentry from '@sentry/nestjs';
import {
  DomainException,
  DomainExceptionKind,
} from '../domain/domain.exception';

const KIND_TO_STATUS: Record<DomainExceptionKind, HttpStatus> = {
  validation: HttpStatus.BAD_REQUEST,
  unauthorized: HttpStatus.UNAUTHORIZED,
  forbidden: HttpStatus.FORBIDDEN,
  'not-found': HttpStatus.NOT_FOUND,
  conflict: HttpStatus.CONFLICT,
};

interface ErrorBody {
  success: false;
  message: string | string[];
  error: { code: number; name: string };
  timestamp: string;
}

/**
 * SEUL endroit où une exception devient une réponse HTTP — `DomainException`
 * (métier), `HttpException` (validation, guards…) et tout le reste (bug,
 * erreur DB…) y passent, contrairement à l'ancien filtre limité à
 * `DomainException` (le reste retombait sur le handler par défaut de Nest via
 * `SentryGlobalFilter`, avec une forme de réponse différente et sans log).
 * Les exceptions imprévues sont reportées à Sentry ici (remplace
 * `SentryGlobalFilter`, supprimé de `app.module.ts`).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let name: string;
    let message: string | string[];

    if (exception instanceof DomainException) {
      status = KIND_TO_STATUS[exception.kind];
      name = exception.name;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        name = exception.name;
        message = res;
      } else {
        const body = res as { error?: string; message?: string | string[] };
        name = body.error ?? exception.name;
        message = body.message ?? exception.message;
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      name = 'InternalServerError';
      message =
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : exception instanceof Error
            ? exception.message
            : 'Internal server error';
      Sentry.captureException(exception);
    }

    const context = `${request.method} ${request.url} → ${status}`;
    if (status >= 500) {
      this.logger.error(
        `${context}: ${Array.isArray(message) ? message.join('; ') : message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `${context}: ${Array.isArray(message) ? message.join('; ') : message}`,
      );
    }

    const body: ErrorBody = {
      success: false,
      message,
      error: { code: status, name },
      timestamp: new Date().toISOString(),
    };
    response.status(status).json(body);
  }
}
