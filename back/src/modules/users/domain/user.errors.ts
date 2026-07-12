import {
  ConflictDomainException,
  ForbiddenDomainException,
  NotFoundDomainException,
} from '../../../shared/domain/domain.exception';

/** L'utilisateur demandé n'existe pas. */
export class UserNotFoundError extends NotFoundDomainException {
  constructor(id: string) {
    super(`User ${id} not found`);
  }
}

/** Le nom d'utilisateur visé est déjà pris par un autre compte. */
export class UsernameAlreadyTakenError extends ConflictDomainException {
  constructor(username: string) {
    super(`Username "${username}" is already taken`);
  }
}

/** L'adresse blockchain est déjà rattachée à un autre compte. */
export class BlockchainAddressAlreadyUsedError extends ConflictDomainException {
  constructor(address: string) {
    super(`Blockchain address ${address} is already linked to another account`);
  }
}

/** Cet utilisateur a déjà un ban actif — éviter les doublons. */
export class UserAlreadyBannedError extends ConflictDomainException {
  constructor() {
    super('This user is already banned');
  }
}

/** Un compte ADMIN ne peut pas être banni. */
export class CannotBanAdminError extends ForbiddenDomainException {
  constructor() {
    super('Admin accounts cannot be banned');
  }
}

/** Le compte authentifié a un ban actif : accès refusé (login + requêtes suivantes). */
export class UserBannedError extends ForbiddenDomainException {
  constructor(reason: string) {
    super(`Account banned: ${reason}`);
  }
}

/** Un propriétaire de marque doit supprimer/transférer sa marque avant de supprimer son compte. */
export class BrandOwnerCannotDeleteAccountError extends ConflictDomainException {
  constructor() {
    super(
      'Cannot delete an account that owns a brand — delete the brand first',
    );
  }
}
