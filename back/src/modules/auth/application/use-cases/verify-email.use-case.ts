import { Injectable } from '@nestjs/common';
import { User } from '../../../users/domain/user';
import { UserRepository } from '../../../users/domain/user.repository';
import { InvalidOrExpiredTokenError } from '../../domain/auth.errors';
import { Mailer } from '../ports/mailer.port';
import { bestEffort } from '../../../../shared/application/best-effort';

/**
 * Vérifie l'email d'un compte via son token : passe `verified=true`, purge le
 * token, et envoie l'email de bienvenue (best-effort).
 */
@Injectable()
export class VerifyEmailUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly mailer: Mailer,
  ) {}

  async execute(token: string): Promise<User> {
    const found = await this.userRepository.findByEmailVerificationToken(token);
    if (!found) {
      throw new InvalidOrExpiredTokenError('Invalid verification token');
    }
    if (found.expiresAt && found.expiresAt < new Date()) {
      throw new InvalidOrExpiredTokenError('Verification token has expired');
    }

    const user = await this.userRepository.markEmailVerified(found.user.id);

    await bestEffort('welcome email', () =>
      this.mailer.sendWelcome(user.email, user.username),
    );

    return user;
  }
}
