import { AppJwtClaims, AppTokenService } from './ports/app-token.service';
import { Mailer } from './ports/mailer.port';
import { PasswordHasher } from './ports/password-hasher.port';
import { SecureTokenGenerator } from './ports/secure-token-generator.port';
import { OAuthProfile, OAuthProvider } from './ports/oauth-provider.port';
import {
  TwoFactorChallenge,
  TwoFactorChallengeRepository,
} from '../domain/two-factor-challenge.repository';
import {
  RefreshTokenRecord,
  RefreshTokenRepository,
} from '../domain/refresh-token.repository';
import { TotpService } from './ports/totp.port';
import { TwoFactorSecretCipher } from './ports/two-factor-secret-cipher.port';

/** Hash factice déterministe (`hashed:<plain>`), sans bcrypt — pour les tests. */
export class FakePasswordHasher extends PasswordHasher {
  hash(plain: string): Promise<string> {
    return Promise.resolve(`hashed:${plain}`);
  }
  compare(plain: string, hash: string): Promise<boolean> {
    return Promise.resolve(hash === `hashed:${plain}`);
  }
}

/** JWT factice `jwt:<userId>` ; verify reconstruit des claims minimales. */
export class FakeAppTokenService extends AppTokenService {
  sign(claims: AppJwtClaims): string {
    return `jwt:${claims.userId}`;
  }
  verify(token: string): AppJwtClaims {
    const userId = token.replace('jwt:', '');
    return { userId, email: '', isBrand: false, verified: true };
  }
}

/** Génère des tokens séquentiels prévisibles (token-1, token-2, …). */
export class FakeTokenGenerator extends SecureTokenGenerator {
  private counter = 0;
  generate(): string {
    this.counter += 1;
    return `token-${this.counter}`;
  }
}

/** Mailer espion : enregistre les appels au lieu d'envoyer. */
export class FakeMailer extends Mailer {
  readonly verifications: { to: string; token: string }[] = [];
  readonly welcomes: string[] = [];
  readonly resets: { to: string; token: string }[] = [];
  readonly changed: string[] = [];
  readonly twoFactorEnabled: string[] = [];
  readonly twoFactorDisabled: string[] = [];

  sendEmailVerification(to: string, _u: string, token: string): Promise<void> {
    this.verifications.push({ to, token });
    return Promise.resolve();
  }
  sendWelcome(to: string): Promise<void> {
    this.welcomes.push(to);
    return Promise.resolve();
  }
  sendPasswordReset(to: string, _u: string, token: string): Promise<void> {
    this.resets.push({ to, token });
    return Promise.resolve();
  }
  sendPasswordChanged(to: string): Promise<void> {
    this.changed.push(to);
    return Promise.resolve();
  }
  sendTwoFactorEnabled(to: string): Promise<void> {
    this.twoFactorEnabled.push(to);
    return Promise.resolve();
  }
  sendTwoFactorDisabled(to: string): Promise<void> {
    this.twoFactorDisabled.push(to);
    return Promise.resolve();
  }
}

/** Fournisseur OAuth factice renvoyant un profil fixe. */
export class FakeOAuthProvider extends OAuthProvider {
  constructor(private readonly profile: OAuthProfile) {
    super();
  }
  getAuthUrl(): string {
    return 'https://accounts.google.com/o/oauth2/auth?fake';
  }
  exchangeCodeForProfile(): Promise<OAuthProfile> {
    return Promise.resolve(this.profile);
  }
}

/** Fake {@link TwoFactorChallengeRepository} en mémoire pour les tests unitaires. */
export class InMemoryTwoFactorChallengeRepository extends TwoFactorChallengeRepository {
  private readonly challenges = new Map<string, TwoFactorChallenge>();

  create(userId: string, token: string, expiresAt: Date): Promise<void> {
    this.challenges.set(token, { token, userId, attempts: 0, expiresAt });
    return Promise.resolve();
  }

  find(token: string): Promise<TwoFactorChallenge | null> {
    return Promise.resolve(this.challenges.get(token) ?? null);
  }

  incrementAttempts(token: string): Promise<number> {
    const challenge = this.challenges.get(token);
    if (!challenge) return Promise.resolve(0);
    challenge.attempts += 1;
    return Promise.resolve(challenge.attempts);
  }

  delete(token: string): Promise<void> {
    this.challenges.delete(token);
    return Promise.resolve();
  }
}

/** Fake {@link RefreshTokenRepository} en mémoire pour les tests unitaires. */
export class InMemoryRefreshTokenRepository extends RefreshTokenRepository {
  private readonly tokens = new Map<string, RefreshTokenRecord>();

  create(userId: string, token: string, expiresAt: Date): Promise<void> {
    this.tokens.set(token, { userId, expiresAt, revokedAt: null });
    return Promise.resolve();
  }

  find(token: string): Promise<RefreshTokenRecord | null> {
    return Promise.resolve(this.tokens.get(token) ?? null);
  }

  revoke(token: string): Promise<void> {
    const record = this.tokens.get(token);
    if (record && !record.revokedAt) {
      this.tokens.set(token, { ...record, revokedAt: new Date() });
    }
    return Promise.resolve();
  }

  revokeAllForUser(userId: string): Promise<void> {
    for (const [token, record] of this.tokens.entries()) {
      if (record.userId === userId && !record.revokedAt) {
        this.tokens.set(token, { ...record, revokedAt: new Date() });
      }
    }
    return Promise.resolve();
  }
}

/**
 * TOTP factice : le code valide est toujours `424242` (6 chiffres, pour
 * matcher le format attendu par `VerifyTwoFactorUseCase` avant dispatch
 * TOTP/recovery-code) — pas de calcul temporel réel.
 */
export class FakeTotpService extends TotpService {
  static readonly VALID_CODE = '424242';

  generateSecret(): string {
    return 'FAKE_SECRET';
  }
  keyUri(secret: string, accountEmail: string): string {
    return `otpauth://totp/ManaChain:${accountEmail}?secret=${secret}&issuer=ManaChain`;
  }
  verify(token: string): boolean {
    return token === FakeTotpService.VALID_CODE;
  }
}

/** Chiffrement factice (identité) pour les tests unitaires. */
export class FakeTwoFactorSecretCipher extends TwoFactorSecretCipher {
  encrypt(secret: string): string {
    return `enc:${secret}`;
  }
  decrypt(payload: string): string {
    return payload.replace(/^enc:/, '');
  }
}
