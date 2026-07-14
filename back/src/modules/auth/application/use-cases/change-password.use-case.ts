import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../users/domain/user.repository';
import { UserNotFoundError } from '../../../users/domain/user.errors';
import { InvalidCredentialsError } from '../../domain/auth.errors';
import { RefreshTokenRepository } from '../../domain/refresh-token.repository';
import { PasswordHasher } from '../ports/password-hasher.port';
import { Mailer } from '../ports/mailer.port';
import { bestEffort } from '../../../../shared/application/best-effort';

/**
 * Change le mot de passe de l'utilisateur authentifié. Exige le mot de passe
 * courant (même garantie d'identité que `DisableTwoFactorUseCase`) : sans ça,
 * un JWT volé suffirait à prendre le compte sans connaître l'ancien mot de
 * passe (H-3 de SECURITY_AUDIT.md). Révoque tous les refresh tokens actifs :
 * les sessions déjà ouvertes ailleurs devront se reconnecter.
 */
@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly mailer: Mailer,
  ) {}

  async execute(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const current = await this.userRepository.findById(userId);
    if (!current) {
      throw new UserNotFoundError(userId);
    }

    const credentials = await this.userRepository.findCredentialsByEmail(
      current.email,
    );
    const ok =
      !!credentials &&
      (await this.passwordHasher.compare(
        currentPassword,
        credentials.passwordHash,
      ));
    if (!ok) {
      throw new InvalidCredentialsError();
    }

    const passwordHash = await this.passwordHasher.hash(newPassword);
    const user = await this.userRepository.updatePassword(userId, passwordHash);
    await this.refreshTokenRepository.revokeAllForUser(userId);

    await bestEffort('password changed email', () =>
      this.mailer.sendPasswordChanged(user.email, user.username),
    );
  }
}
