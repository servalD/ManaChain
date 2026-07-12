/** Message email rendu, prêt à être envoyé. */
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * PORT d'envoi d'email bas niveau (transport). Les mailers métier (auth, brands)
 * rendent leurs templates puis délèguent l'envoi ici. Adapter par défaut :
 * Resend + fallback simulation (log) si RESEND_API_KEY non configuré.
 */
export abstract class EmailSender {
  abstract send(message: EmailMessage): Promise<void>;
}
