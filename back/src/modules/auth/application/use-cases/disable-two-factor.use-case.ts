import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../users/domain/user.repository';
import { UserNotFoundError } from '../../../users/domain/user.errors';
import { TwoFactorRecoveryCodeRepository } from '../../../users/domain/two-factor-recovery-code.repository';
import {
  InvalidCredentialsError,
  TwoFactorNotEnabledError,
} from '../../domain/auth.errors';
import { PasswordHasher } from '../ports/password-hasher.port';
import { Mailer } from '../ports/mailer.port';
import { bestEffort } from '../../../../shared/application/best-effort';

/**
 * Désactive le 2FA. Demande le mot de passe courant (pas un code TOTP) :
 * un utilisateur ayant perdu son authenticator doit pouvoir désactiver le
 * 2FA avec ce qu'il lui reste — son mot de passe — même sans accès aux codes
 * de récupération (mêmes garanties d'identité que `ChangePasswordUseCase`).
 */
@Injectable()
export class DisableTwoFactorUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly recoveryCodeRepository: TwoFactorRecoveryCodeRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly mailer: Mailer,
  ) {}

  async execute(userId: string, password: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError(userId);
    if (!user.twoFactorEnabled) throw new TwoFactorNotEnabledError();

    const credentials = await this.userRepository.findCredentialsByEmail(
      user.email,
    );
    const ok =
      !!credentials &&
      (await this.passwordHasher.compare(password, credentials.passwordHash));
    if (!ok) throw new InvalidCredentialsError();

    await this.userRepository.disableTwoFactor(userId);
    await this.recoveryCodeRepository.deleteAll(userId);

    await bestEffort('two-factor disabled email', () =>
      this.mailer.sendTwoFactorDisabled(user.email, user.username),
    );
  }
}
