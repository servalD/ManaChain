import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Env } from '../config/env.validation';
import { EmailMessage, EmailSender } from './email-sender';

/**
 * Adapter {@link EmailSender} basé sur Nodemailer. Si le SMTP n'est pas configuré,
 * bascule en **mode simulation** (log) pour que les flux restent testables en
 * local sans serveur mail.
 */
@Injectable()
export class NodemailerEmailSender extends EmailSender {
  private readonly logger = new Logger(NodemailerEmailSender.name);
  private readonly transporter: nodemailer.Transporter | null;

  constructor(private readonly config: ConfigService<Env, true>) {
    super();
    this.transporter = this.createTransporter();
  }

  async send(message: EmailMessage): Promise<void> {
    const from = this.config.get('EMAIL_FROM', { infer: true });
    if (!this.transporter) {
      this.logger.warn(
        `[SIMULATION] Email to ${message.to} — "${message.subject}" (SMTP not configured)`,
      );
      return;
    }
    await this.transporter.sendMail({
      from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    this.logger.log(`Email sent to ${message.to} — "${message.subject}"`);
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
