import {
  ConflictDomainException,
  ForbiddenDomainException,
  UnauthorizedDomainException,
  ValidationDomainException,
} from '../../../shared/domain/domain.exception';

/**
 * Jeton (JWT) absent, malformé, expiré, de signature invalide, ou référençant un
 * utilisateur qui n'existe plus. Utilisé par le guard global.
 */
export class InvalidTokenError extends UnauthorizedDomainException {
  constructor(message = 'Invalid or expired token') {
    super(message);
  }
}

/** Email ou mot de passe incorrect (message volontairement générique). */
export class InvalidCredentialsError extends UnauthorizedDomainException {
  constructor() {
    super('Incorrect email or password');
  }
}

/** Tentative de login sur un compte dont l'email n'est pas vérifié. */
export class EmailNotVerifiedError extends ForbiddenDomainException {
  constructor() {
    super('Please verify your email address before logging in');
  }
}

/** Email déjà rattaché à un compte (inscription). */
export class EmailAlreadyRegisteredError extends ConflictDomainException {
  constructor() {
    super('This email address is already in use');
  }
}

/** Email déjà vérifié (renvoi de vérification inutile). */
export class EmailAlreadyVerifiedError extends ConflictDomainException {
  constructor() {
    super('This email is already verified');
  }
}

/** Jeton de vérification / reset invalide ou expiré (flux email). */
export class InvalidOrExpiredTokenError extends ValidationDomainException {
  constructor(message = 'Invalid or expired link') {
    super(message);
  }
}

/**
 * Connexion Google sur un email déjà inscrit avec un mot de passe : l'utilisateur
 * doit se connecter par mot de passe. Mappé côté présentation vers `?error=use_password`.
 */
export class OAuthEmailUsesPasswordError extends ConflictDomainException {
  constructor() {
    super(
      'This email is registered with a password; sign in with your password',
    );
  }
}

// --- 2FA TOTP ---

/** Code TOTP (ou code de récupération) incorrect. */
export class InvalidTwoFactorCodeError extends UnauthorizedDomainException {
  constructor() {
    super('Invalid two-factor authentication code');
  }
}

/** `setup` ou `enable` appelé alors que le 2FA est déjà actif. */
export class TwoFactorAlreadyEnabledError extends ConflictDomainException {
  constructor() {
    super('Two-factor authentication is already enabled');
  }
}

/** `enable` appelé sans `setup` préalable (aucun secret en attente). */
export class TwoFactorSetupNotStartedError extends ConflictDomainException {
  constructor() {
    super('Start two-factor setup before enabling it');
  }
}

/** `disable` appelé alors que le 2FA n'est pas actif. */
export class TwoFactorNotEnabledError extends ConflictDomainException {
  constructor() {
    super('Two-factor authentication is not enabled');
  }
}

/** Challenge de login absent, expiré, ou déjà consommé. */
export class InvalidOrExpiredTwoFactorChallengeError extends UnauthorizedDomainException {
  constructor() {
    super('Invalid or expired two-factor challenge — please log in again');
  }
}

/**
 * Ticket d'échange OAuth (callback Google) absent, expiré, ou déjà consommé —
 * remplace la transmission du JWT/refresh token en clair dans l'URL de
 * redirection.
 */
export class InvalidOrExpiredOAuthTicketError extends UnauthorizedDomainException {
  constructor() {
    super('Invalid or expired login ticket — please log in again');
  }
}

/** Trop de tentatives ratées sur un même challenge : force un nouveau login. */
export class TooManyTwoFactorAttemptsError extends UnauthorizedDomainException {
  constructor() {
    super('Too many attempts — please log in again');
  }
}
