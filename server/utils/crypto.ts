import * as crypto from 'crypto';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';

export class SecurityUtils {
  /**
   * Hash a string with SHA256 (for legacy purposes)
   */
  static toSHA256(str: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(str);
    return hash.digest('hex');
  }

  /**
   * Generate a random token
   */
  static randomToken(): string {
    const bytes = randomBytes(32);
    return bytes.toString('hex');
  }

  /**
   * Hash a password with bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare a password with its hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
