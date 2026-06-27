import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '../../modules/users/domain/user';

/**
 * Injecte l'utilisateur authentifié (attaché à la requête par le {@link AuthGuard}
 * global après vérification du Bearer + rechargement en base).
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: User }>();
    return request.user;
  },
);
