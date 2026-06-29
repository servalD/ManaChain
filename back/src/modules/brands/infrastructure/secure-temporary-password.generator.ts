import { Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { TemporaryPasswordGenerator } from '../domain/temporary-password-generator';

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

/**
 * Adapter {@link TemporaryPasswordGenerator} : 12 caractères avec au moins un de
 * chaque catégorie, puis mélange (porté de `server/utils/crypto.ts`).
 */
@Injectable()
export class SecureTemporaryPasswordGenerator extends TemporaryPasswordGenerator {
  generate(): string {
    const chars = [
      UPPER[randomInt(UPPER.length)],
      LOWER[randomInt(LOWER.length)],
      DIGITS[randomInt(DIGITS.length)],
      SYMBOLS[randomInt(SYMBOLS.length)],
    ];
    for (let i = 0; i < 8; i++) {
      chars.push(ALL[randomInt(ALL.length)]);
    }
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
  }
}
