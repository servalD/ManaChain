import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  DomainException,
  DomainExceptionKind,
} from '../domain/domain.exception';

/**
 * SEUL endroit où une exception métier devient un statut HTTP. Les use-cases
 * lèvent des {@link DomainException} ignorantes du protocole ; ce filtre (couche
 * présentation) les traduit. Toute autre exception non gérée est laissée au
 * filtre par défaut de Nest (→ 500).
 */
const KIND_TO_STATUS: Record<DomainExceptionKind, HttpStatus> = {
  validation: HttpStatus.BAD_REQUEST,
  unauthorized: HttpStatus.UNAUTHORIZED,
  forbidden: HttpStatus.FORBIDDEN,
  'not-found': HttpStatus.NOT_FOUND,
  conflict: HttpStatus.CONFLICT,
};

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = KIND_TO_STATUS[exception.kind];

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
    });
  }
}
