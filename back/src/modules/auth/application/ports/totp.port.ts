/**
 * PORT : génération/vérification TOTP (RFC 6238), compatible Google
 * Authenticator / Authy / etc.
 */
export abstract class TotpService {
  /** Secret aléatoire encodé en Base32 (jamais persisté en clair — cf. {@link TwoFactorSecretCipher}). */
  abstract generateSecret(): string;
  /** URI `otpauth://totp/...` pour le QR code / la saisie manuelle. */
  abstract keyUri(secret: string, accountEmail: string): string;
  abstract verify(token: string, secret: string): boolean;
}
