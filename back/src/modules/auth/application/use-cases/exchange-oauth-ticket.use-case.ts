import { Injectable } from '@nestjs/common';
import { User } from '../../../users/domain/user';
import { UserRepository } from '../../../users/domain/user.repository';
import { UserBanRepository } from '../../../users/domain/user-ban.repository';
import { UserBannedError } from '../../../users/domain/user.errors';
import { OAuthLoginTicketRepository } from '../../domain/oauth-login-ticket.repository';
import { TwoFactorChallengeRepository } from '../../domain/two-factor-challenge.repository';
import { InvalidOrExpiredOAuthTicketError } from '../../domain/auth.errors';
import { AppTokenService } from '../ports/app-token.service';
import { SecureTokenGenerator } from '../ports/secure-token-generator.port';
import { RefreshTokenRepository } from '../../domain/refresh-token.repository';
import { issueSession } from '../session';
import { createTwoFactorChallenge } from '../create-two-factor-challenge';

export interface ExchangeOAuthTicketSession {
  twoFactorRequired: false;
  user: User;
  token: string;
  refreshToken: string;
}

export interface ExchangeOAuthTicketChallenge {
  twoFactorRequired: true;
  challengeToken: string;
}

export type ExchangeOAuthTicketResult =
  ExchangeOAuthTicketSession | ExchangeOAuthTicketChallenge;

/**
 * Consomme le ticket d'échange posé par `GoogleCallbackUseCase` — remplace la
 * transmission du JWT/refresh token ou du challenge 2FA en clair dans l'URL
 * de redirection. Ticket à usage unique (le redeem atomique de
 * {@link OAuthLoginTicketRepository} empêche le rejeu). Décide ici, côté
 * serveur, si une session complète peut être émise directement ou si un
 * challenge 2FA (déjà hashé en base, cf. `TypeOrmTwoFactorChallengeRepository`)
 * doit être résolu au préalable via `/auth/2fa/verify`.
 */
@Injectable()
export class ExchangeOAuthTicketUseCase {
  constructor(
    private readonly ticketRepository: OAuthLoginTicketRepository,
    private readonly userRepository: UserRepository,
    private readonly userBanRepository: UserBanRepository,
    private readonly challengeRepository: TwoFactorChallengeRepository,
    private readonly tokenService: AppTokenService,
    private readonly tokenGenerator: SecureTokenGenerator,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(ticket: string): Promise<ExchangeOAuthTicketResult> {
    const userId = await this.ticketRepository.redeem(ticket);
    if (!userId) {
      throw new InvalidOrExpiredOAuthTicketError();
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new InvalidOrExpiredOAuthTicketError();
    }

    const activeBan = await this.userBanRepository.findActive(user.id);
    if (activeBan) {
      throw new UserBannedError(activeBan.reason);
    }

    if (user.twoFactorEnabled) {
      const challengeToken = await createTwoFactorChallenge(
        this.tokenGenerator,
        this.challengeRepository,
        user.id,
      );
      return { twoFactorRequired: true, challengeToken };
    }

    const session = await issueSession(
      user,
      this.tokenService,
      this.tokenGenerator,
      this.refreshTokenRepository,
    );
    return { twoFactorRequired: false, user, ...session };
  }
}
