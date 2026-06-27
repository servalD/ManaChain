/**
 * PORT : hachage et vérification de mots de passe. Adapter par défaut : bcrypt.
 */
export abstract class PasswordHasher {
  abstract hash(plain: string): Promise<string>;
  abstract compare(plain: string, hash: string): Promise<boolean>;
}
