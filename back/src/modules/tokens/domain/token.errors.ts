import { NotFoundDomainException } from '../../../shared/domain/domain.exception';

/**
 * Écritures (create/purchase/transfer/update-price) et leurs erreurs
 * associées ont été retirées : la chaîne est la source de vérité, `tokens`
 * n'expose plus que des lectures (voir `temp-plan/phase-2-back-chain-sync.md`).
 */
export class TokenNotFoundError extends NotFoundDomainException {
  constructor() {
    super('Token not found');
  }
}
