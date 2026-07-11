/** Un challenge 2FA en attente, tel que persisté. */
export interface TwoFactorChallenge {
  token: string;
  userId: string;
  attempts: number;
  expiresAt: Date;
}

/**
 * Repository PORT de la table `user_two_factor_challenge`. Le jeton est un
 * secret opaque généré par {@link SecureTokenGenerator} (PAS un JWT) : voir la
 * note de sécurité dans la migration `1750000000007-TwoFactorAuth.ts` — un JWT
 * signé serait accepté tel quel par `AuthenticateBearerUseCase` et
 * court-circuiterait le 2FA.
 */
export abstract class TwoFactorChallengeRepository {
  abstract create(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void>;
  abstract find(token: string): Promise<TwoFactorChallenge | null>;
  /** Incrémente le compteur de tentatives ratées, retourne le nouveau total. */
  abstract incrementAttempts(token: string): Promise<number>;
  /** Usage unique : supprimé après succès, expiration, ou trop de tentatives. */
  abstract delete(token: string): Promise<void>;
}
