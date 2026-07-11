import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../../../infrastructure/config/env.validation';
import { EmailSender } from '../../../../infrastructure/email/email-sender';
import { Mailer } from '../../application/ports/mailer.port';
import {
  passwordChangedEmail,
  passwordResetEmail,
  twoFactorDisabledEmail,
  twoFactorEnabledEmail,
  verificationEmail,
  welcomeEmail,
} from './email-templates';

/**
 * Adapter {@link Mailer} : rend les templates d'auth (TS) et délègue l'envoi au
 * transport partagé {@link EmailSender}. Construit les URLs front à partir du token.
 */
@Injectable()
export class EmailMailer extends Mailer {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly sender: EmailSender,
  ) {
    super();
  }

  sendEmailVerification(
    to: string,
    username: string,
    verificationToken: string,
  ): Promise<void> {
    const url = `${this.frontendUrl}/verify-email?token=${verificationToken}`;
    return this.sender.send({
      to,
      ...verificationEmail(username, url, this.logoUrl),
    });
  }

  sendWelcome(to: string, username: string): Promise<void> {
    return this.sender.send({ to, ...welcomeEmail(username, this.logoUrl) });
  }

  sendPasswordReset(
    to: string,
    username: string,
    resetToken: string,
  ): Promise<void> {
    const url = `${this.frontendUrl}/reset-password?token=${resetToken}`;
    return this.sender.send({
      to,
      ...passwordResetEmail(username, url, this.logoUrl),
    });
  }

  sendPasswordChanged(to: string, username: string): Promise<void> {
    return this.sender.send({
      to,
      ...passwordChangedEmail(username, this.logoUrl),
    });
  }

  sendTwoFactorEnabled(to: string, username: string): Promise<void> {
    return this.sender.send({
      to,
      ...twoFactorEnabledEmail(username, this.logoUrl),
    });
  }

  sendTwoFactorDisabled(to: string, username: string): Promise<void> {
    return this.sender.send({
      to,
      ...twoFactorDisabledEmail(username, this.logoUrl),
    });
  }

  private get frontendUrl(): string {
    return this.config.get('FRONTEND_URL', { infer: true });
  }

  private get logoUrl(): string {
    return `${this.config.get('API_URL', { infer: true })}/assets/Logo_ManaChain_Noir.svg`;
  }
}
