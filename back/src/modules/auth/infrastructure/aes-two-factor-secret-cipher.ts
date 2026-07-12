import { Injectable } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../../infrastructure/config/env.validation';
import { TwoFactorSecretCipher } from '../application/ports/two-factor-secret-cipher.port';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Adapter {@link TwoFactorSecretCipher} : AES-256-GCM, clé dérivée par SHA-256
 * de `TWO_FACTOR_ENCRYPTION_KEY` (accepte n'importe quelle chaîne ≥32
 * caractères sans contrainte de format hex/base64). Payload stocké =
 * base64(iv ‖ authTag ‖ ciphertext).
 */
@Injectable()
export class AesTwoFactorSecretCipher extends TwoFactorSecretCipher {
  constructor(private readonly config: ConfigService<Env, true>) {
    super();
  }

  private get key(): Buffer {
    const raw = this.config.get('TWO_FACTOR_ENCRYPTION_KEY', { infer: true });
    return createHash('sha256').update(raw).digest();
  }

  encrypt(secret: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(secret, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
  }

  decrypt(payload: string): string {
    const buffer = Buffer.from(payload, 'base64');
    const iv = buffer.subarray(0, IV_LENGTH);
    const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  }
}
