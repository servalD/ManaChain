import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../users/domain/user.repository';
import { UserNotFoundError } from '../../../users/domain/user.errors';
import { TwoFactorRecoveryCodeRepository } from '../../../users/domain/two-factor-recovery-code.repository';
import {
  InvalidTwoFactorCodeError,
  TwoFactorAlreadyEnabledError,
  TwoFactorSetupNotStartedError,
} from '../../domain/auth.errors';
import { TotpService } from '../ports/totp.port';
import { TwoFactorSecretCipher } from '../ports/two-factor-secret-cipher.port';
import { PasswordHasher } from '../ports/password-hasher.port';
import { SecureTokenGenerator } from '../ports/secure-token-generator.port';
import { Mailer } from '../ports/mailer.port';

const RECOVERY_CODE_COUNT = 10;

/**
 * Étape 2/2 de l'activation du 2FA : vérifie un code TOTP live contre le
 * secret posé par `SetupTwoFactorUseCase`, génère les codes de récupération
 * (affichés une seule fois, en clair, dans la réponse), puis active le flag.
 */
@Injectable()
export class EnableTwoFactorUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly recoveryCodeRepository: TwoFactorRecoveryCodeRepository,
    private readonly totpService: TotpService,
    private readonly cipher: TwoFactorSecretCipher,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenGenerator: SecureTokenGenerator,
    private readonly mailer: Mailer,
  ) {}

  async execute(userId: string, code: string): Promise<string[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError(userId);
    if (user.twoFactorEnabled) throw new TwoFactorAlreadyEnabledError();

    const encryptedSecret =
      await this.userRepository.getTwoFactorSecret(userId);
    if (!encryptedSecret) throw new TwoFactorSetupNotStartedError();

    const secret = this.cipher.decrypt(encryptedSecret);
    const valid = this.totpService.verify(code, secret);
    if (!valid) throw new InvalidTwoFactorCodeError();

    const codes = this.generateRecoveryCodes();
    // Le hash porte sur la forme normalisée (sans tiret) : VerifyTwoFactorUseCase
    // normalise pareillement la saisie utilisateur avant de comparer.
    const hashes = await Promise.all(
      codes.map((c) => this.passwordHasher.hash(c.raw)),
    );
    await this.recoveryCodeRepository.replaceAll(userId, hashes);
    await this.userRepository.enableTwoFactor(userId);

    await this.safeSend(() =>
      this.mailer.sendTwoFactorEnabled(user.email, user.username),
    );

    return codes.map((c) => c.formatted);
  }

  private generateRecoveryCodes(): { raw: string; formatted: string }[] {
    return Array.from({ length: RECOVERY_CODE_COUNT }, () => {
      const raw = this.tokenGenerator.generate().slice(0, 10);
      return { raw, formatted: `${raw.slice(0, 5)}-${raw.slice(5, 10)}` };
    });
  }

  private async safeSend(send: () => Promise<void>): Promise<void> {
    try {
      await send();
    } catch {
      /* email non bloquant */
    }
  }
}
