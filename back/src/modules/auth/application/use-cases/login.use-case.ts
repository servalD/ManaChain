import { Injectable } from '@nestjs/common';
import { User } from '../../../users/domain/user';
import { UserRepository } from '../../../users/domain/user.repository';
import { UserBanRepository } from '../../../users/domain/user-ban.repository';
import { UserBannedError } from '../../../users/domain/user.errors';
import {
  EmailNotVerifiedError,
  InvalidCredentialsError,
} from '../../domain/auth.errors';
import { PasswordHasher } from '../ports/password-hasher.port';
import { AppTokenService } from '../ports/app-token.service';
import { SecureTokenGenerator } from '../ports/secure-token-generator.port';
import { TwoFactorChallengeRepository } from '../../domain/two-factor-challenge.repository';
import { createTwoFactorChallenge } from '../create-two-factor-challenge';
import { toAppJwtClaims } from '../jwt-claims';

export interface LoginSuccess {
  twoFactorRequired: false;
  user: User;
  token: string;
}

export interface LoginTwoFactorRequired {
  twoFactorRequired: true;
  challengeToken: string;
}

export type LoginResult = LoginSuccess | LoginTwoFactorRequired;

/**
 * Connexion locale : vérifie l'email confirmé + le mot de passe (bcrypt), et
 * signe un JWT — sauf si le 2FA est actif, auquel cas un challenge opaque est
 * créé et renvoyé à la place (cf. `VerifyTwoFactorUseCase`). Message d'erreur
 * générique pour ne pas révéler l'existence du compte.
 */
@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userBanRepository: UserBanRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: AppTokenService,
    private readonly tokenGenerator: SecureTokenGenerator,
    private readonly challengeRepository: TwoFactorChallengeRepository,
  ) {}

  async execute(email: string, password: string): Promise<LoginResult> {
    const credentials = await this.userRepository.findCredentialsByEmail(email);
    if (!credentials) {
      throw new InvalidCredentialsError();
    }

    if (!credentials.user.verified) {
      throw new EmailNotVerifiedError();
    }

    const activeBan = await this.userBanRepository.findActive(
      credentials.user.id,
    );
    if (activeBan) {
      throw new UserBannedError(activeBan.reason);
    }

    const ok = await this.passwordHasher.compare(
      password,
      credentials.passwordHash,
    );
    if (!ok) {
      throw new InvalidCredentialsError();
    }

    if (credentials.user.twoFactorEnabled) {
      const challengeToken = await createTwoFactorChallenge(
        this.tokenGenerator,
        this.challengeRepository,
        credentials.user.id,
      );
      return { twoFactorRequired: true, challengeToken };
    }

    const token = this.tokenService.sign(toAppJwtClaims(credentials.user));
    return { twoFactorRequired: false, user: credentials.user, token };
  }
}
