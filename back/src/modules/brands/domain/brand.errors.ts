import {
  ConflictDomainException,
  ForbiddenDomainException,
  NotFoundDomainException,
  ValidationDomainException,
} from '../../../shared/domain/domain.exception';

// --- Marques ---

export class BrandNotFoundError extends NotFoundDomainException {
  constructor() {
    super('Brand not found');
  }
}

export class UserAlreadyHasBrandError extends ConflictDomainException {
  constructor() {
    super('This user already has a brand');
  }
}

export class BrandNameTakenError extends ConflictDomainException {
  constructor() {
    super('This brand name is already in use');
  }
}

export class NotBrandOwnerError extends ForbiddenDomainException {
  constructor() {
    super('You do not have permission to modify this brand');
  }
}

export class AccountNotVerifiedError extends ForbiddenDomainException {
  constructor() {
    super('Please verify your email before creating a brand');
  }
}

/** Cette marque a déjà un ban actif — éviter les doublons. */
export class BrandAlreadyBannedError extends ConflictDomainException {
  constructor() {
    super('This brand is already banned');
  }
}

// --- Médias ---

export class MediaNotFoundError extends NotFoundDomainException {
  constructor() {
    super('Media not found');
  }
}

export class MediaBrandMismatchError extends ValidationDomainException {
  constructor() {
    super('Media does not belong to this brand');
  }
}

// --- Candidatures ---

export class BrandApplicationNotFoundError extends NotFoundDomainException {
  constructor() {
    super('Brand application not found');
  }
}

export class InvalidInterestSelectionError extends ValidationDomainException {
  constructor(message: string) {
    super(message);
  }
}

export class RegistrationNumberTakenError extends ConflictDomainException {
  constructor() {
    super('This business registration number is already registered');
  }
}

/**
 * Approving an application creates a brand-new BRANDUSER account (never an
 * upgrade of an existing one) — if `contactEmail` already belongs to a user,
 * that INSERT collides with the unique email constraint. Caught here, at
 * submission time, instead of surfacing as a raw DB error at approval time.
 */
export class ApplicationContactEmailAlreadyRegisteredError extends ConflictDomainException {
  constructor() {
    super(
      'This email is already used by an existing account. Please use a different email for the brand contact.',
    );
  }
}

export class ApplicationBrandNameTakenError extends ConflictDomainException {
  constructor() {
    super('This brand name is already in use or pending approval');
  }
}

export class ApplicationNotReviewableError extends ConflictDomainException {
  constructor() {
    super('Only pending or needs_review applications can be reviewed');
  }
}

export class ApplicationEmailNotVerifiedError extends ConflictDomainException {
  constructor() {
    super('Email must be verified before the application can be approved');
  }
}

export class InvalidOrExpiredApplicationTokenError extends ValidationDomainException {
  constructor(message = 'Invalid or expired verification token') {
    super(message);
  }
}
