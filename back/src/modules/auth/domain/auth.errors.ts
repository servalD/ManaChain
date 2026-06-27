import { UnauthorizedDomainException } from '../../../shared/domain/domain.exception';

/**
 * Jeton absent, malformé, expiré, de signature invalide, ou référençant un
 * utilisateur qui n'existe plus.
 */
export class InvalidTokenError extends UnauthorizedDomainException {
  constructor(message = 'Invalid or expired token') {
    super(message);
  }
}
