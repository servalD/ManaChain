import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { Env } from '../../../infrastructure/config/env.validation';
import {
  OAuthProfile,
  OAuthProvider,
} from '../application/ports/oauth-provider.port';

interface GoogleUserInfo {
  email?: string;
  given_name?: string;
  family_name?: string;
}

/**
 * Adapter {@link OAuthProvider} pour Google (`google-auth-library`). Lève si les
 * identifiants ne sont pas configurés ; le use-case / contrôleur traduit en
 * redirection `?error=google_failed`.
 */
@Injectable()
export class GoogleOAuthProvider extends OAuthProvider {
  constructor(private readonly config: ConfigService<Env, true>) {
    super();
  }

  getAuthUrl(): string {
    return this.client().generateAuthUrl({
      access_type: 'offline',
      scope: ['email', 'profile'],
      prompt: 'consent',
    });
  }

  async exchangeCodeForProfile(code: string): Promise<OAuthProfile> {
    const client = this.client();
    const { tokens } = await client.getToken(code);
    if (!tokens.access_token) {
      throw new Error('Google did not return an access token');
    }

    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    );
    if (!response.ok) {
      throw new Error('Failed to fetch Google user info');
    }
    const info = (await response.json()) as GoogleUserInfo;
    if (!info.email) {
      throw new Error('Google profile is missing an email');
    }

    return {
      email: info.email,
      firstName: info.given_name?.trim() || null,
      lastName: info.family_name?.trim() || null,
    };
  }

  private client(): OAuth2Client {
    const clientId = this.config.get('GOOGLE_CLIENT_ID', { infer: true });
    const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET', {
      infer: true,
    });
    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth is not configured');
    }
    const redirectUri = `${this.config.get('API_URL', { infer: true })}/auth/google/callback`;
    return new OAuth2Client(clientId, clientSecret, redirectUri);
  }
}
