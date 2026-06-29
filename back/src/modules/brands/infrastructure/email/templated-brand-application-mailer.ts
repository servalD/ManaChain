import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../../../infrastructure/config/env.validation';
import { EmailSender } from '../../../../infrastructure/email/email-sender';
import { BrandApplication } from '../../domain/brand-application';
import { BrandApplicationMailer } from '../../domain/brand-application-mailer.port';
import {
  adminNotificationEmail,
  applicationApprovedEmail,
  applicationRejectedEmail,
  applicationVerificationEmail,
} from './brand-application-templates';

/**
 * Adapter {@link BrandApplicationMailer} : rend les templates de candidature et
 * délègue au transport partagé {@link EmailSender}.
 */
@Injectable()
export class TemplatedBrandApplicationMailer extends BrandApplicationMailer {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly sender: EmailSender,
  ) {
    super();
  }

  sendVerification(
    to: string,
    firstName: string,
    brandName: string,
    token: string,
  ): Promise<void> {
    const url = `${this.frontendUrl}/verify-brand-application?token=${token}`;
    return this.sender.send({
      to,
      ...applicationVerificationEmail(firstName, brandName, url, this.logoUrl),
    });
  }

  sendAdminNotification(
    to: string,
    application: BrandApplication,
  ): Promise<void> {
    const reviewUrl = `${this.frontendUrl}/admin/applications/${application.id}`;
    return this.sender.send({
      to,
      ...adminNotificationEmail(
        application.brandName,
        `${application.contactFirstName} ${application.contactLastName}`.trim(),
        application.contactEmail,
        application.country,
        reviewUrl,
        this.logoUrl,
      ),
    });
  }

  sendApproved(
    to: string,
    brandName: string,
    username: string,
    temporaryPassword: string,
  ): Promise<void> {
    const loginUrl = `${this.frontendUrl}/login`;
    return this.sender.send({
      to,
      ...applicationApprovedEmail(
        brandName,
        username,
        temporaryPassword,
        loginUrl,
        this.logoUrl,
      ),
    });
  }

  sendRejected(
    to: string,
    brandName: string,
    rejectionReason: string,
  ): Promise<void> {
    const applicationUrl = `${this.frontendUrl}/brand-application`;
    return this.sender.send({
      to,
      ...applicationRejectedEmail(
        brandName,
        rejectionReason,
        applicationUrl,
        this.logoUrl,
      ),
    });
  }

  private get frontendUrl(): string {
    return this.config.get('FRONTEND_URL', { infer: true });
  }

  private get logoUrl(): string {
    return `${this.config.get('API_URL', { infer: true })}/assets/Logo_ManaChain_Noir.svg`;
  }
}
