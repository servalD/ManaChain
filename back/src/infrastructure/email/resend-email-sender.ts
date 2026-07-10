import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { Env } from '../config/env.validation';
import { EmailMessage, EmailSender } from './email-sender';

/**
 * Adapter {@link EmailSender} basé sur Resend. Si `RESEND_API_KEY` n'est pas
 * configuré, bascule en **mode simulation** (log) pour que les flux restent
 * testables en local sans compte Resend.
 */
@Injectable()
export class ResendEmailSender extends EmailSender {
  private readonly logger = new Logger(ResendEmailSender.name);
  private readonly client: Resend | null;

  constructor(private readonly config: ConfigService<Env, true>) {
    super();
    const apiKey = this.config.get('RESEND_API_KEY', { infer: true });
    this.client = apiKey ? new Resend(apiKey) : null;
  }

  async send(message: EmailMessage): Promise<void> {
    const from = this.config.get('EMAIL_FROM', { infer: true });
    if (!this.client) {
      this.logger.warn(
        `[SIMULATION] Email to ${message.to} — "${message.subject}" (RESEND_API_KEY not configured)`,
      );
      return;
    }
    const { error } = await this.client.emails.send({
      from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    if (error) {
      throw new Error(`Resend email send failed: ${error.message}`);
    }
    this.logger.log(`Email sent to ${message.to} — "${message.subject}"`);
  }
}
