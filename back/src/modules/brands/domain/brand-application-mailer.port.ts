import { BrandApplication } from './brand-application';

/**
 * PORT d'envoi des emails liés au cycle de candidature de marque. Méthodes
 * sémantiques ; l'adapter rend les templates et délègue au transport partagé.
 */
export abstract class BrandApplicationMailer {
  abstract sendVerification(
    to: string,
    firstName: string,
    brandName: string,
    token: string,
  ): Promise<void>;

  abstract sendAdminNotification(
    to: string,
    application: BrandApplication,
  ): Promise<void>;

  abstract sendApproved(
    to: string,
    brandName: string,
    username: string,
    temporaryPassword: string,
  ): Promise<void>;

  abstract sendRejected(
    to: string,
    brandName: string,
    rejectionReason: string,
  ): Promise<void>;
}
