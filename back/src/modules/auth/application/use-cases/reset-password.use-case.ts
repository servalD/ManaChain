import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../users/domain/user.repository';
import { InvalidOrExpiredTokenError } from '../../domain/auth.errors';
import { PasswordHasher } from '../ports/password-hasher.port';
import { Mailer } from '../ports/mailer.port';

/**
 * Réinitialise le mot de passe via un token de reset valide : hash le nouveau
 * mot de passe, purge le token, envoie l'email de confirmation (best-effort).
 */
@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly mailer: Mailer,
  ) {}

  async execute(token: string, newPassword: string): Promise<void> {
    const found = await this.userRepository.findByPasswordResetToken(token);
    if (!found || !found.expiresAt || found.expiresAt < new Date()) {
      throw new InvalidOrExpiredTokenError('Invalid or expired reset link');
    }

    const passwordHash = await this.passwordHasher.hash(newPassword);
    const user = await this.userRepository.updatePassword(
      found.user.id,
      passwordHash,
    );

    try {
      await this.mailer.sendPasswordChanged(user.email, user.username);
    } catch {
      /* email non bloquant */
    }
  }
}
