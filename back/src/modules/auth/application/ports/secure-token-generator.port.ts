/**
 * PORT : génération de jetons aléatoires sûrs (vérification email, reset mot de
 * passe). Adapter par défaut : `node:crypto` randomBytes(32) en hex.
 */
export abstract class SecureTokenGenerator {
  abstract generate(): string;
}
