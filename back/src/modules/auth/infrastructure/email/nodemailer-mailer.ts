import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Env } from '../../../../infrastructure/config/env.validation';
import { Mailer } from '../../application/ports/mailer.port';
import {
  passwordChangedEmail,
  passwordResetEmail,
  RenderedEmail,
  verificationEmail,
  welcomeEmail,
} from './email-templates';

/**
 * Adapter {@link Mailer} : rend les templates TS et envoie via SMTP. Si le SMTP
 * n'est pas configuré, bascule en **mode simulation** (log) — comme l'Express —
 * pour que les flux d'auth restent testables en local sans serveur mail.
 */
@Injectable()
export class NodemailerMailer extends Mailer {
  private readonly logger = new Logger(NodemailerMailer.name);
  private readonly transporter: nodemailer.Transporter | null;

  constructor(private readonly config: ConfigService<Env, true>) {
    super();
    this.transporter = this.createTransporter();
  }

  sendEmailVerification(
    to: string,
    username: string,
    verificationToken: string,
  ): Promise<void> {
    const url = `${this.frontendUrl}/verify-email?token=${verificationToken}`;
    return this.send(to, verificationEmail(username, url, this.logoUrl));
  }

  sendWelcome(to: string, username: string): Promise<void> {
    return this.send(to, welcomeEmail(username, this.logoUrl));
  }

  sendPasswordReset(
    to: string,
    username: string,
    resetToken: string,
  ): Promise<void> {
    const url = `${this.frontendUrl}/reset-password?token=${resetToken}`;
    return this.send(to, passwordResetEmail(username, url, this.logoUrl));
  }

  sendPasswordChanged(to: string, username: string): Promise<void> {
    return this.send(to, passwordChangedEmail(username, this.logoUrl));
  }

  // --- internals ---

  private get frontendUrl(): string {
    return this.config.get('FRONTEND_URL', { infer: true });
  }

  private get logoUrl(): string {
    return `${this.config.get('API_URL', { infer: true })}/assets/Logo_ManaChain_Noir.svg`;
  }

  private async send(to: string, email: RenderedEmail): Promise<void> {
    const from = this.config.get('EMAIL_FROM', { infer: true });
    if (!this.transporter) {
      // Mode simulation : pas de SMTP configuré.
      this.logger.warn(
        `[SIMULATION] Email to ${to} — "${email.subject}" (SMTP not configured)`,
      );
      return;
    }
    await this.transporter.sendMail({
      from,
      to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    this.logger.log(`Email sent to ${to} — "${email.subject}"`);
  }

  private createTransporter(): nodemailer.Transporter | null {
    const host = this.config.get('SMTP_HOST', { infer: true });
    const user = this.config.get('SMTP_USER', { infer: true });
    const pass = this.config.get('SMTP_PASS', { infer: true });
    if (!host || !user || !pass) {
      return null;
    }
    const port = this.config.get('SMTP_PORT', { infer: true });
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
}
