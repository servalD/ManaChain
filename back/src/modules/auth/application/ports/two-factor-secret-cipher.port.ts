/**
 * PORT : chiffrement du secret TOTP au repos. Contrairement à un mot de passe
 * (hash à sens unique), le secret TOTP doit rester réversible pour calculer
 * les codes — d'où un chiffrement symétrique plutôt qu'un hash.
 */
export abstract class TwoFactorSecretCipher {
  abstract encrypt(secret: string): string;
  abstract decrypt(payload: string): string;
}
