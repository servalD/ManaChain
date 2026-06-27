import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Env } from '../../../../infrastructure/config/env.validation';
import { User } from '../../../users/domain/user';
import { UserRepository } from '../../../users/domain/user.repository';
import { InvalidTokenError } from '../../domain/auth.errors';

/**
 * Vérifie un JWT applicatif (HS256, secret partagé avec l'Express actuel) puis
 * RECHARGE l'utilisateur depuis la base — comme l'ancien `requireAuth` : le rôle
 * vient de la DB, jamais des claims, donc un changement de rôle est pris en
 * compte immédiatement. Alimente le {@link AuthGuard} global.
 *
 * Ne lève que des exceptions de DOMAINE ({@link InvalidTokenError}).
 */
interface AppJwtClaims {
  userId?: string;
}

@Injectable()
export class AuthenticateBearerUseCase {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(token: string): Promise<User> {
    let claims: AppJwtClaims;
    try {
      claims = jwt.verify(
        token,
        this.config.get('APP_JWT_SECRET', { infer: true }),
      ) as AppJwtClaims;
    } catch {
      throw new InvalidTokenError();
    }

    if (!claims.userId) {
      throw new InvalidTokenError('Token is missing the userId claim');
    }

    const user = await this.userRepository.findById(claims.userId);
    if (!user) {
      throw new InvalidTokenError('Token references a non-existing user');
    }
    return user;
  }
}
