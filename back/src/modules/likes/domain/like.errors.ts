import {
  ConflictDomainException,
  ForbiddenDomainException,
  NotFoundDomainException,
} from '../../../shared/domain/domain.exception';

/** Marque inexistante (like sur une marque absente). */
export class BrandNotFoundError extends NotFoundDomainException {
  constructor(brandId: string) {
    super(`Brand ${brandId} not found`);
  }
}

/** L'utilisateur a déjà aimé cette marque. */
export class AlreadyLikedError extends ConflictDomainException {
  constructor() {
    super('You have already liked this brand');
  }
}

/** Like inexistant. */
export class LikeNotFoundError extends NotFoundDomainException {
  constructor(likeId: string) {
    super(`Like ${likeId} not found`);
  }
}

/** Tentative de supprimer le like d'un autre utilisateur. */
export class NotLikeOwnerError extends ForbiddenDomainException {
  constructor() {
    super('You can only remove your own like');
  }
}

/** Consultation des likes d'une marque qu'on ne possède pas (et non-admin). */
export class NotBrandOwnerError extends ForbiddenDomainException {
  constructor() {
    super('You do not have permission to view likes for this brand');
  }
}
