import { Injectable } from '@nestjs/common';
import { User } from '../../../users/domain/user';
import { UserRepository } from '../../../users/domain/user.repository';
import { UserBanRepository } from '../../../users/domain/user-ban.repository';
import { UserBannedError } from '../../../users/domain/user.errors';
import { RefreshTokenRepository } from '../../domain/refresh-token.repository';
import { InvalidTokenError } from '../../domain/auth.errors';
import { AppTokenService } from '../ports/app-token.service';
import { SecureTokenGenerator } from '../ports/secure-token-generator.port';
import { issueSession, Session } from '../session';

export interface RefreshSessionResult extends Session {
  user: User;
}

/**
 * Échange un refresh token contre une nouvelle session (rotation) : l'ancien
 * jeton est révoqué avant d'en émettre un nouveau, donc un jeton volé et déjà
 * utilisé par son propriétaire légitime redevient inutilisable — mais la
 * réutilisation d'un jeton déjà révoqué signale un vol probable (le voleur ET
 * le légitime ont chacun tenté un refresh) : dans ce cas, TOUTE la session de
 * l'utilisateur est invalidée plutôt que de se contenter de rejeter l'appel.
 */
@Injectable()
export class RefreshSessionUseCase {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly userRepository: UserRepository,
    private readonly userBanRepository: UserBanRepository,
    private readonly tokenService: AppTokenService,
    private readonly tokenGenerator: SecureTokenGenerator,
  ) {}

  async execute(refreshToken: string): Promise<RefreshSessionResult> {
    const record = await this.refreshTokenRepository.find(refreshToken);
    if (!record || record.expiresAt.getTime() < Date.now()) {
      throw new InvalidTokenError();
    }

    if (record.revokedAt) {
      await this.refreshTokenRepository.revokeAllForUser(record.userId);
      throw new InvalidTokenError();
    }

    const user = await this.userRepository.findById(record.userId);
    if (!user) {
      throw new InvalidTokenError();
    }

    const activeBan = await this.userBanRepository.findActive(user.id);
    if (activeBan) {
      throw new UserBannedError(activeBan.reason);
    }

    await this.refreshTokenRepository.revoke(refreshToken);
    const session = await issueSession(
      user,
      this.tokenService,
      this.tokenGenerator,
      this.refreshTokenRepository,
    );
    return { user, ...session };
  }
}
