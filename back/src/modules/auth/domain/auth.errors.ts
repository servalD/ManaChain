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
