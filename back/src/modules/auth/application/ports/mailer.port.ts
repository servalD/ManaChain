/**
 * PORT : envoi des emails transactionnels d'authentification. Les méthodes sont
 * sémantiques (pas de HTML/transport ici) : l'adapter rend le template et
 * envoie, et construit les URLs (front) à partir du token + de la config.
 */
export abstract class Mailer {
  abstract sendEmailVerification(
    to: string,
    username: string,
    verificationToken: string,
  ): Promise<void>;

  abstract sendWelcome(to: string, username: string): Promise<void>;

  abstract sendPasswordReset(
    to: string,
    username: string,
    resetToken: string,
  ): Promise<void>;

  abstract sendPasswordChanged(to: string, username: string): Promise<void>;

  abstract sendTwoFactorEnabled(to: string, username: string): Promise<void>;

  abstract sendTwoFactorDisabled(to: string, username: string): Promise<void>;
}
