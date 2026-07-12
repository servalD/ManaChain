/** Un code de récupération 2FA (hashé), tel que persisté. */
export interface TwoFactorRecoveryCode {
  id: string;
  codeHash: string;
}

/**
 * Repository PORT de la table `user_two_factor_recovery_code`. Les codes sont
 * générés et hashés (bcrypt, via {@link PasswordHasher}) par
 * `EnableTwoFactorUseCase` — ce port ne connaît que des hash, jamais les codes
 * en clair (mêmes garanties que `passwordHash`).
 */
export abstract class TwoFactorRecoveryCodeRepository {
  /** Efface les codes existants et insère le nouveau lot (activation / réactivation). */
  abstract replaceAll(userId: string, codeHashes: string[]): Promise<void>;
  /** Codes non consommés, pour comparaison en mémoire par `VerifyTwoFactorUseCase`. */
  abstract findUnused(userId: string): Promise<TwoFactorRecoveryCode[]>;
  /** Marque un code comme consommé (usage unique). */
  abstract markUsed(id: string): Promise<void>;
  /** Efface tous les codes d'un utilisateur (désactivation du 2FA). */
  abstract deleteAll(userId: string): Promise<void>;
}
