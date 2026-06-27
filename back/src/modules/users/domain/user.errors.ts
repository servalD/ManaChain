import {
  ConflictDomainException,
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
