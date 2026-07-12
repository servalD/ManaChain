import { Injectable } from '@nestjs/common';
import { User } from '../../../users/domain/user';
import { UserRepository } from '../../../users/domain/user.repository';
import { UserNotFoundError } from '../../../users/domain/user.errors';
import { TwoFactorAlreadyEnabledError } from '../../domain/auth.errors';
import { TotpService } from '../ports/totp.port';
import { TwoFactorSecretCipher } from '../ports/two-factor-secret-cipher.port';

export interface SetupTwoFactorResult {
  secret: string;
  otpauthUri: string;
}

/**
 * Étape 1/2 de l'activation du 2FA : génère un secret TOTP et le persiste
 * chiffré (`two_factor_enabled` reste `false` tant que `EnableTwoFactorUseCase`
 * n'a pas vérifié un code live — évite d'activer un secret jamais scanné).
 */
@Injectable()
export class SetupTwoFactorUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly totpService: TotpService,
    private readonly cipher: TwoFactorSecretCipher,
  ) {}

  async execute(userId: string): Promise<SetupTwoFactorResult> {
    const user = await this.getUser(userId);
    if (user.twoFactorEnabled) {
      throw new TwoFactorAlreadyEnabledError();
    }

    const secret = this.totpService.generateSecret();
    await this.userRepository.setTwoFactorSecret(
      userId,
      this.cipher.encrypt(secret),
    );

    return { secret, otpauthUri: this.totpService.keyUri(secret, user.email) };
  }

  private async getUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError(userId);
    return user;
  }
}
