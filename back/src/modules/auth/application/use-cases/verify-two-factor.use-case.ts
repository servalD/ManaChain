import { Injectable } from '@nestjs/common';
import { User } from '../../../users/domain/user';
import { UserRepository } from '../../../users/domain/user.repository';
import { UserBanRepository } from '../../../users/domain/user-ban.repository';
import { UserBannedError } from '../../../users/domain/user.errors';
import { TwoFactorRecoveryCodeRepository } from '../../../users/domain/two-factor-recovery-code.repository';
import { TwoFactorChallengeRepository } from '../../domain/two-factor-challenge.repository';
import {
  InvalidOrExpiredTwoFactorChallengeError,
  InvalidTwoFactorCodeError,
  TooManyTwoFactorAttemptsError,
} from '../../domain/auth.errors';
import { TotpService } from '../ports/totp.port';
import { TwoFactorSecretCipher } from '../ports/two-factor-secret-cipher.port';
import { PasswordHasher } from '../ports/password-hasher.port';
import { AppTokenService } from '../ports/app-token.service';
import { SecureTokenGenerator } from '../ports/secure-token-generator.port';
import { RefreshTokenRepository } from '../../domain/refresh-token.repository';
import { issueSession } from '../session';
import { normalizeRecoveryCode } from '../two-factor-recovery-code.util';

export interface VerifyTwoFactorResult {
  user: User;
  token: string;
  refreshToken: string;
}

const MAX_ATTEMPTS = 5;
const TOTP_FORMAT = /^\d{6}$/;

/**
 * Second facteur du login : consomme le challenge créé par `LoginUseCase` (ou
 * `GoogleCallbackUseCase`), vérifie un code TOTP live OU un code de
 * récupération, et ne signe le JWT final qu'en cas de succès. Le challenge est
 * à usage unique (supprimé après succès, expiration, ou trop de tentatives) —
 * les échecs incrémentent un compteur pour limiter le brute-force.
 */
@Injectable()
export class VerifyTwoFactorUseCase {
  constructor(
    private readonly challengeRepository: TwoFactorChallengeRepository,
    private readonly userRepository: UserRepository,
    private readonly userBanRepository: UserBanRepository,
    private readonly recoveryCodeRepository: TwoFactorRecoveryCodeRepository,
    private readonly totpService: TotpService,
    private readonly cipher: TwoFactorSecretCipher,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: AppTokenService,
    private readonly tokenGenerator: SecureTokenGenerator,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(
    challengeToken: string,
    code: string,
  ): Promise<VerifyTwoFactorResult> {
    const challenge = await this.challengeRepository.find(challengeToken);
    if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
      if (challenge) await this.challengeRepository.delete(challengeToken);
      throw new InvalidOrExpiredTwoFactorChallengeError();
    }
    if (challenge.attempts >= MAX_ATTEMPTS) {
      await this.challengeRepository.delete(challengeToken);
      throw new TooManyTwoFactorAttemptsError();
    }

    const user = await this.userRepository.findById(challenge.userId);
    if (!user) {
      await this.challengeRepository.delete(challengeToken);
      throw new InvalidOrExpiredTwoFactorChallengeError();
    }

    const valid = await this.verifyCode(user.id, code);
    if (!valid) {
      const attempts = await this.challengeRepository.incrementAttempts(
        challengeToken,
      );
      if (attempts >= MAX_ATTEMPTS) {
        await this.challengeRepository.delete(challengeToken);
        throw new TooManyTwoFactorAttemptsError();
      }
      throw new InvalidTwoFactorCodeError();
    }

    const activeBan = await this.userBanRepository.findActive(user.id);
    if (activeBan) {
      await this.challengeRepository.delete(challengeToken);
      throw new UserBannedError(activeBan.reason);
    }

    await this.challengeRepository.delete(challengeToken);
    const session = await issueSession(
      user,
      this.tokenService,
      this.tokenGenerator,
      this.refreshTokenRepository,
    );
    return { user, ...session };
  }

  private async verifyCode(userId: string, code: string): Promise<boolean> {
    if (TOTP_FORMAT.test(code.trim())) {
      const encryptedSecret = await this.userRepository.getTwoFactorSecret(
        userId,
      );
      if (!encryptedSecret) return false;
      return this.totpService.verify(code.trim(), this.cipher.decrypt(encryptedSecret));
    }
    return this.tryRecoveryCode(userId, code);
  }

  private async tryRecoveryCode(
    userId: string,
    rawCode: string,
  ): Promise<boolean> {
    const normalized = normalizeRecoveryCode(rawCode);
    const unused = await this.recoveryCodeRepository.findUnused(userId);
    for (const candidate of unused) {
      if (await this.passwordHasher.compare(normalized, candidate.codeHash)) {
        await this.recoveryCodeRepository.markUsed(candidate.id);
        return true;
      }
    }
    return false;
  }
}
