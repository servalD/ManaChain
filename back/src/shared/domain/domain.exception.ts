/**
 * Base des exceptions MÉTIER. La couche `application` (use-cases) et la couche
 * `domain` ne lèvent QUE des sous-classes de {@link DomainException} — jamais
 * d'exception `@nestjs/*`. La traduction vers HTTP est faite uniquement dans la
 * couche présentation par {@link DomainExceptionFilter}.
 *
 * `kind` porte la sémantique métier ; le filtre la mappe vers un code HTTP sans
 * que le domaine n'ait à connaître le protocole.
 */
export type DomainExceptionKind =
  'validation' | 'unauthorized' | 'forbidden' | 'not-found' | 'conflict';

export abstract class DomainException extends Error {
  abstract readonly kind: DomainExceptionKind;

  protected constructor(message: string) {
    super(message);
    // Garde le vrai nom de la sous-classe (utile dans la réponse d'erreur).
    this.name = new.target.name;
  }
}

/** La ressource demandée n'existe pas → 404. */
export abstract class NotFoundDomainException extends DomainException {
  readonly kind = 'not-found' as const;
}

/** Conflit avec l'état courant (unicité, doublon…) → 409. */
export abstract class ConflictDomainException extends DomainException {
  readonly kind = 'conflict' as const;
}

/** Entrée invalide au regard d'une règle métier → 400. */
export abstract class ValidationDomainException extends DomainException {
  readonly kind = 'validation' as const;
}

/** Authentification absente ou invalide → 401. */
export abstract class UnauthorizedDomainException extends DomainException {
  readonly kind = 'unauthorized' as const;
}

/** Authentifié mais non autorisé → 403. */
export abstract class ForbiddenDomainException extends DomainException {
  readonly kind = 'forbidden' as const;
}
