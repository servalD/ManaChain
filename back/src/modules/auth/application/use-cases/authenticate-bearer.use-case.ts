import { Injectable } from '@nestjs/common';
import { User } from '../../../users/domain/user';
import { UserRepository } from '../../../users/domain/user.repository';
import { InvalidTokenError } from '../../domain/auth.errors';
import { AppTokenService } from '../ports/app-token.service';

/**
 * Vérifie un JWT applicatif (via {@link AppTokenService}) puis RECHARGE
 * l'utilisateur depuis la base — comme l'ancien `requireAuth` : le rôle vient de
 * la DB, jamais des claims, donc un changement de rôle est pris en compte
 * immédiatement. Alimente le {@link AuthGuard} global.
 *
 * Ne lève que des exceptions de DOMAINE ({@link InvalidTokenError}).
 */
@Injectable()
export class AuthenticateBearerUseCase {
  constructor(
    private readonly tokenService: AppTokenService,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(token: string): Promise<User> {
    let userId: string;
    try {
      userId = this.tokenService.verify(token).userId;
    } catch {
      throw new InvalidTokenError();
    }

    if (!userId) {
      throw new InvalidTokenError('Token is missing the userId claim');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new InvalidTokenError('Token references a non-existing user');
    }
    return user;
  }
}
