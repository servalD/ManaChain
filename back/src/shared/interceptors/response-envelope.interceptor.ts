import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IS_RAW_RESPONSE_KEY } from '../decorators/raw-response.decorator';

export interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

/**
 * Enveloppe symétrique du succès, miroir de {@link AllExceptionsFilter} côté
 * erreur (`{success:false, message, error, timestamp}`) — un client peut
 * discriminer sur `success` sans inspecter le status code. Les routes
 * `@RawResponse()` (ex. `/metrics`, format Prometheus texte) en sont exemptées.
 */
@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | T
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | T> {
    const isRaw = this.reflector.getAllAndOverride<boolean>(
      IS_RAW_RESPONSE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isRaw) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
