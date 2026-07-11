export interface RefreshTokenRecord {
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

/**
 * Repository PORT de la table `refresh_token`. Le jeton manipulé ici est
 * TOUJOURS le jeton opaque en clair — le hash SHA-256 persisté est un détail
 * d'implémentation de l'adapter (cf. `TypeOrmRefreshTokenRepository`).
 */
export abstract class RefreshTokenRepository {
  abstract create(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void>;
  abstract find(token: string): Promise<RefreshTokenRecord | null>;
  /** Idempotent : révoquer un jeton déjà révoqué ou inconnu n'est pas une erreur. */
  abstract revoke(token: string): Promise<void>;
  /** Invalide toutes les sessions actives d'un utilisateur (vol détecté, changement de mot de passe). */
  abstract revokeAllForUser(userId: string): Promise<void>;
}
