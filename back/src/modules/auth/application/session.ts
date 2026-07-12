import { User } from '../../users/domain/user';
import { AppTokenService } from './ports/app-token.service';
import { SecureTokenGenerator } from './ports/secure-token-generator.port';
import { RefreshTokenRepository } from '../domain/refresh-token.repository';
import { toAppJwtClaims } from './jwt-claims';

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

export interface Session {
  token: string;
  refreshToken: string;
}

/**
 * Émet une session complète : JWT applicatif court (15 min, cf.
 * `APP_JWT_EXPIRES_IN`) + jeton de refresh opaque révocable, persisté via
 * `RefreshTokenRepository`. Point d'émission UNIQUE pour tous les flux de
 * connexion (login, google, 2FA, refresh) — cf. H-3 de SECURITY_AUDIT.md.
 */
export async function issueSession(
  user: User,
  tokenService: AppTokenService,
  tokenGenerator: SecureTokenGenerator,
  refreshTokenRepository: RefreshTokenRepository,
): Promise<Session> {
  const token = tokenService.sign(toAppJwtClaims(user));
  const refreshToken = tokenGenerator.generate();
  await refreshTokenRepository.create(
    user.id,
    refreshToken,
    new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  );
  return { token, refreshToken };
}
