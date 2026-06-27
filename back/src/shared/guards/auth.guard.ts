import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticateBearerUseCase } from '../../modules/auth/application/use-cases/authenticate-bearer.use-case';

/**
 * Garde d'authentification globale. Vérifie le Bearer (JWT applicatif), recharge
 * l'utilisateur en base et l'attache à la requête. Les routes `@Public()` sont
 * ignorées.
 *
 * Note couche : la garde est un élément de présentation/framework. L'absence de
 * jeton est un défaut de protocole → exception Nest. La *validité* du jeton est
 * déléguée au use-case, qui lève une exception de domaine (mappée par le filtre).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authenticateBearer: AuthenticateBearerUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const user = await this.authenticateBearer.execute(token);
    (request as Request & { user: typeof user }).user = user;
    return true;
  }

  private extractToken(request: Request): string | null {
    const header = request.headers.authorization ?? '';
    const [type, token] = header.split(' ');
    return type?.toLowerCase() === 'bearer' && token ? token : null;
  }
}
