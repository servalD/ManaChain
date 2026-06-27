import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { SecureTokenGenerator } from '../application/ports/secure-token-generator.port';

/**
 * Adapter {@link SecureTokenGenerator} : 32 octets aléatoires en hexadécimal
 * (identique à l'Express : `crypto.randomBytes(32).toString('hex')`).
 */
@Injectable()
export class CryptoTokenGenerator extends SecureTokenGenerator {
  generate(): string {
    return randomBytes(32).toString('hex');
  }
}
