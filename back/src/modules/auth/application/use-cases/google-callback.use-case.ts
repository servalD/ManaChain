import { Injectable } from '@nestjs/common';
import { Role } from '../../../../shared/enums/role.enum';
import {
  OAUTH_GOOGLE_PASSWORD_SENTINEL,
  UserRepository,
} from '../../../users/domain/user.repository';
import { OAuthEmailUsesPasswordError } from '../../domain/auth.errors';
import { TwoFactorChallengeRepository } from '../../domain/two-factor-challenge.repository';
import { OAuthProvider } from '../ports/oauth-provider.port';
import { AppTokenService } from '../ports/app-token.service';
import { SecureTokenGenerator } from '../ports/secure-token-generator.port';
import { RefreshTokenRepository } from '../../domain/refresh-token.repository';
import { createTwoFactorChallenge } from '../create-two-factor-challenge';
import { issueSession } from '../session';

export interface GoogleCallbackSuccess {
  twoFactorRequired: false;
  token: string;
  refreshToken: string;
  role: Role;
}

export interface GoogleCallbackTwoFactorRequired {
  twoFactorRequired: true;
  challengeToken: string;
}

export type GoogleCallbackResult =
  GoogleCallbackSuccess | GoogleCallbackTwoFactorRequired;

/**
 * Callback Google : échange le code contre un profil, puis find-or-create.
 * - email déjà inscrit avec mot de passe → {@link OAuthEmailUsesPasswordError}.
 * - email déjà inscrit via Google, 2FA actif → challenge (cf. `LoginUseCase`).
 * - email déjà inscrit via Google, pas de 2FA → reconnexion directe.
 * - email inconnu → création d'un compte Google (vérifié) avec un username
 *   unique — jamais de 2FA actif sur un compte tout juste créé.
 * Renvoie le JWT + le rôle (le contrôleur fait la redirection front).
 */
@Injectable()
export class GoogleCallbackUseCase {
  constructor(
    private readonly oauthProvider: OAuthProvider,
    private readonly userRepository: UserRepository,
    private readonly tokenService: AppTokenService,
    private readonly tokenGenerator: SecureTokenGenerator,
    private readonly challengeRepository: TwoFactorChallengeRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(code: string): Promise<GoogleCallbackResult> {
    const profile = await this.oauthProvider.exchangeCodeForProfile(code);

    const existing = await this.userRepository.findCredentialsByEmail(
      profile.email,
    );
    if (existing) {
      if (existing.passwordHash !== OAUTH_GOOGLE_PASSWORD_SENTINEL) {
        throw new OAuthEmailUsesPasswordError();
      }
      if (existing.user.twoFactorEnabled) {
        const challengeToken = await createTwoFactorChallenge(
          this.tokenGenerator,
          this.challengeRepository,
          existing.user.id,
        );
        return { twoFactorRequired: true, challengeToken };
      }
      const session = await issueSession(
        existing.user,
        this.tokenService,
        this.tokenGenerator,
        this.refreshTokenRepository,
      );
      return { twoFactorRequired: false, ...session, role: existing.user.role };
    }

    const username = await this.generateUniqueUsername(profile.email);
    const user = await this.userRepository.createGoogle({
      email: profile.email,
      username,
      firstName: profile.firstName || 'User',
      lastName: profile.lastName || '',
    });

    const session = await issueSession(
      user,
      this.tokenService,
      this.tokenGenerator,
      this.refreshTokenRepository,
    );
    return { twoFactorRequired: false, ...session, role: user.role };
  }

  private async generateUniqueUsername(email: string): Promise<string> {
    const base =
      email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 30) || 'user';

    let candidate = base;
    for (let attempt = 0; attempt < 10; attempt++) {
      if (attempt > 0) {
        candidate = `${base}_${this.tokenGenerator.generate().slice(0, 6)}`;
      }
      const taken = await this.userRepository.findByUsername(candidate);
      if (!taken) {
        return candidate;
      }
    }
    // Dernier recours : suffixe long très improbable en collision.
    return `${base}_${this.tokenGenerator.generate().slice(0, 12)}`;
  }
}
