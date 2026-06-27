/** Profil normalisé renvoyé par un fournisseur OAuth (Google). */
export interface OAuthProfile {
  email: string;
  firstName: string | null;
  lastName: string | null;
}

/**
 * PORT : fournisseur OAuth externe (Google). `getAuthUrl` renvoie l'URL de
 * consentement ; `exchangeCodeForProfile` échange le code contre le profil.
 * Lève si le fournisseur n'est pas configuré ou si l'échange échoue.
 */
export abstract class OAuthProvider {
  abstract getAuthUrl(): string;
  abstract exchangeCodeForProfile(code: string): Promise<OAuthProfile>;
}
