import {
  ConflictDomainException,
  ForbiddenDomainException,
  NotFoundDomainException,
  ValidationDomainException,
} from '../../../shared/domain/domain.exception';

/** L'utilisateur n'a pas de marque (requis pour créer un token). */
export class BrandRequiredError extends NotFoundDomainException {
  constructor() {
    super('You must have a brand to create a token');
  }
}

export class BrandAlreadyHasTokenError extends ConflictDomainException {
  constructor() {
    super('This brand already has a token');
  }
}

export class TokenSymbolTakenError extends ConflictDomainException {
  constructor() {
    super('This token symbol is already in use');
  }
}

export class TokenNotFoundError extends NotFoundDomainException {
  constructor() {
    super('Token not found');
  }
}

export class NotTokenOwnerError extends ForbiddenDomainException {
  constructor() {
    super('You do not have permission to modify this token');
  }
}

export class AccountNotVerifiedError extends ForbiddenDomainException {
  constructor() {
    super('Please verify your email before trading tokens');
  }
}

export class InvalidAmountError extends ValidationDomainException {
  constructor() {
    super('Amount must be positive');
  }
}

export class InvalidPriceError extends ValidationDomainException {
  constructor() {
    super('Invalid price');
  }
}

export class SelfTransferError extends ValidationDomainException {
  constructor() {
    super('Cannot transfer to yourself');
  }
}

export class InsufficientBalanceError extends ValidationDomainException {
  constructor() {
    super('Insufficient balance');
  }
}
