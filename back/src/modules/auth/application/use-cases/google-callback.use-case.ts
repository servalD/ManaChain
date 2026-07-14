import { Injectable } from '@nestjs/common';
import {
  OAUTH_GOOGLE_PASSWORD_SENTINEL,
  UserRepository,
} from '../../../users/domain/user.repository';
import { OAuthEmailUsesPasswordError } from '../../domain/auth.errors';
import { OAuthLoginTicketRepository } from '../../domain/oauth-login-ticket.repository';
import { OAuthProvider } from '../ports/oauth-provider.port';
import { SecureTokenGenerator } from '../ports/secure-token-generator.port';
import { createOAuthLoginTicket } from '../create-oauth-login-ticket';

export interface GoogleCallbackResult {
  /**
   * Ticket d'échange à usage unique — jamais le JWT/refresh token ni le
   * challenge 2FA directement (le contrôleur redirige avec `?ticket=`, le
   * front l'échange via `POST /auth/oauth/exchange`, qui décide alors s'il
   * faut un code 2FA ou renvoie directement une session). Évite d'exposer
   * tout secret de session dans l'URL (historique navigateur, logs
   * serveur/proxy, breadcrumbs Sentry).
   */
  ticket: string;
}

/**
 * Callback Google : échange le code contre un profil, puis find-or-create.
 * - email déjà inscrit avec mot de passe → {@link OAuthEmailUsesPasswordError}.
 * - email déjà inscrit via Google, ou inconnu (création d'un compte Google
 *   vérifié, username unique) → ticket d'échange dans tous les cas. La
 *   décision 2FA-requise-ou-pas est déportée dans `ExchangeOAuthTicketUseCase`
 *   (server-side, jamais dans l'URL de redirection).
 */
@Injectable()
export class GoogleCallbackUseCase {
  constructor(
    private readonly oauthProvider: OAuthProvider,
    private readonly userRepository: UserRepository,
    private readonly tokenGenerator: SecureTokenGenerator,
    private readonly ticketRepository: OAuthLoginTicketRepository,
  ) {}

  async execute(code: string): Promise<GoogleCallbackResult> {
    const profile = await this.oauthProvider.exchangeCodeForProfile(code);

    const existing = await this.userRepository.findCredentialsByEmail(
      profile.email,
    );

    let userId: string;
    if (existing) {
      if (existing.passwordHash !== OAUTH_GOOGLE_PASSWORD_SENTINEL) {
        throw new OAuthEmailUsesPasswordError();
      }
      userId = existing.user.id;
    } else {
      const username = await this.generateUniqueUsername(profile.email);
      const user = await this.userRepository.createGoogle({
        email: profile.email,
        username,
        firstName: profile.firstName || 'User',
        lastName: profile.lastName || '',
      });
      userId = user.id;
    }

    const ticket = await createOAuthLoginTicket(
      this.tokenGenerator,
      this.ticketRepository,
      userId,
    );
    return { ticket };
  }

  private async generateUniqueUsername(email: string): Promise<string> {
    const base =
      email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 30) || 'user';

    let candidate = base;
    for (let attempt = 0; attempt < 10; attempt++) {
      if (attempt > 0) {
        candidate = `${base}_${this.tokenGenerator.generate().slice(0, 6)}`;
      }
      const taken = await this.userRepository.findByUsername(candidate);
      if (!taken) {
        return candidate;
      }
    }
    // Dernier recours : suffixe long très improbable en collision.
    return `${base}_${this.tokenGenerator.generate().slice(0, 12)}`;
  }
}
