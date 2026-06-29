import { Module } from '@nestjs/common';
import { EmailSender } from './email-sender';
import { NodemailerEmailSender } from './nodemailer-email-sender';

/**
 * Fournit le transport email partagé ({@link EmailSender}). Importé par les
 * modules qui envoient des emails (auth, brands) ; chacun garde ses propres
 * templates et son mailer métier.
 */
@Module({
  providers: [{ provide: EmailSender, useClass: NodemailerEmailSender }],
  exports: [EmailSender],
})
export class EmailModule {}
