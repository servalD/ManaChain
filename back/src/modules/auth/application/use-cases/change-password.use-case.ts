import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../users/domain/user.repository';
import { UserNotFoundError } from '../../../users/domain/user.errors';
import { PasswordHasher } from '../ports/password-hasher.port';
import { Mailer } from '../ports/mailer.port';

/**
 * Change le mot de passe de l'utilisateur authentifié. Met `password_changed=true`
 * (géré par le repo) et envoie l'email de confirmation (best-effort).
 */
@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly mailer: Mailer,
  ) {}

  async execute(userId: string, newPassword: string): Promise<void> {
    const current = await this.userRepository.findById(userId);
    if (!current) {
      throw new UserNotFoundError(userId);
    }

    const passwordHash = await this.passwordHasher.hash(newPassword);
    const user = await this.userRepository.updatePassword(userId, passwordHash);

    try {
      await this.mailer.sendPasswordChanged(user.email, user.username);
    } catch {
      /* email non bloquant */
    }
  }
}
