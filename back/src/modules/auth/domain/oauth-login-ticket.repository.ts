/**
 * Repository PORT de la table `oauth_login_ticket`. Le jeton manipulé ici est
 * TOUJOURS le jeton opaque en clair — le hash SHA-256 persisté est un détail
 * d'implémentation de l'adapter (cf. `TypeOrmOAuthLoginTicketRepository`),
 * même approche que {@link RefreshTokenRepository}.
 */
export abstract class OAuthLoginTicketRepository {
  abstract create(
    userId: string,
    ticket: string,
    expiresAt: Date,
  ): Promise<void>;

  /**
   * Consomme le ticket de façon atomique (UPDATE ... RETURNING) : un ticket
   * expiré, déjà utilisé, ou inconnu renvoie `null` sans effet de bord.
   */
  abstract redeem(ticket: string): Promise<string | null>;
}
