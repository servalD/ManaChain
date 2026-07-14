import { OAuthLoginTicketRepository } from '../domain/oauth-login-ticket.repository';
import { SecureTokenGenerator } from './ports/secure-token-generator.port';

/**
 * Durée de vie d'un ticket d'échange OAuth : consommé immédiatement par le
 * front (pas d'interaction utilisateur entre la redirection et l'échange,
 * contrairement au challenge 2FA) — court délibérément.
 */
export const OAUTH_TICKET_TTL_MS = 2 * 60 * 1000; // 2 minutes

/** Crée un ticket d'échange opaque pour `userId`, consommé par `/auth/oauth/exchange`. */
export const createOAuthLoginTicket = async (
  tokenGenerator: SecureTokenGenerator,
  ticketRepository: OAuthLoginTicketRepository,
  userId: string,
): Promise<string> => {
  const ticket = tokenGenerator.generate();
  const expiresAt = new Date(Date.now() + OAUTH_TICKET_TTL_MS);
  await ticketRepository.create(userId, ticket, expiresAt);
  return ticket;
};
