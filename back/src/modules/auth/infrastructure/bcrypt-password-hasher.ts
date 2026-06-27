import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PasswordHasher } from '../application/ports/password-hasher.port';

const SALT_ROUNDS = 10;

/**
 * Adapter {@link PasswordHasher} basé sur bcryptjs. Compatible avec les hash
 * produits par `bcrypt` (natif) côté Express : même format `$2a$/$2b$`, donc les
 * comptes existants se connectent sans re-hash.
 */
@Injectable()
export class BcryptPasswordHasher extends PasswordHasher {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
