import { Module } from '@nestjs/common';
import { EmailSender } from './email-sender';
import { ResendEmailSender } from './resend-email-sender';

/**
 * Fournit le transport email partagé ({@link EmailSender}). Importé par les
 * modules qui envoient des emails (auth, brands) ; chacun garde ses propres
 * templates et son mailer métier.
 */
@Module({
  providers: [{ provide: EmailSender, useClass: ResendEmailSender }],
  exports: [EmailSender],
})
export class EmailModule {}
