import { AppJwtClaims, AppTokenService } from './ports/app-token.service';
import { Mailer } from './ports/mailer.port';
import { PasswordHasher } from './ports/password-hasher.port';
import { SecureTokenGenerator } from './ports/secure-token-generator.port';
import { OAuthProfile, OAuthProvider } from './ports/oauth-provider.port';

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
