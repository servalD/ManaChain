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

  /**
   * Generate a secure random password with 12 characters
   * Contains uppercase, lowercase, numbers, and symbols
   */
  static generateSecurePassword(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + symbols;
    
    // Ensure at least one character from each category
    let password = '';
    password += uppercase[crypto.randomInt(0, uppercase.length)];
    password += lowercase[crypto.randomInt(0, lowercase.length)];
    password += numbers[crypto.randomInt(0, numbers.length)];
    password += symbols[crypto.randomInt(0, symbols.length)];
    
    // Fill remaining 8 characters randomly
    for (let i = 0; i < 8; i++) {
      password += allChars[crypto.randomInt(0, allChars.length)];
    }
    
    // Shuffle the password
    const passwordArray = password.split('');
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }
    
    return passwordArray.join('');
  }

  /**
   * Generate a unique username from a brand name
   * Normalizes the name (lowercase, removes spaces and special chars)
   * The caller should check for uniqueness and append a number if needed
   */
  static generateUsernameFromBrandName(brandName: string): string {
    // Convert to lowercase
    let username = brandName.toLowerCase();
    
    // Remove accents and special characters
    username = username.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Replace spaces and special chars with underscore, then remove multiple underscores
    username = username.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
    
    // Remove leading/trailing underscores
    username = username.replace(/^_+|_+$/g, '');
    
    // If empty, use a default
    if (!username) {
      username = 'brand';
    }
    
    // Limit length to 30 characters
    if (username.length > 30) {
      username = username.substring(0, 30);
    }
    
    return username;
  }
}
