import { Injectable } from '@nestjs/common';
import { OAuthProvider } from '../ports/oauth-provider.port';

/**
 * Démarre le flux Google : renvoie l'URL de consentement vers laquelle rediriger.
 * Lève si Google n'est pas configuré (le contrôleur redirige alors vers le front
 * avec une erreur).
 */
@Injectable()
export class GoogleLoginUseCase {
  constructor(private readonly oauthProvider: OAuthProvider) {}

  execute(): string {
    return this.oauthProvider.getAuthUrl();
  }
}
