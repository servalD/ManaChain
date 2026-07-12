import {
  ForbiddenDomainException,
  ValidationDomainException,
} from '../../../shared/domain/domain.exception';

export class InvalidMediaFileError extends ValidationDomainException {
  constructor(message: string) {
    super(message);
  }
}

/** Le CID appartient à une ressource d'un autre utilisateur — suppression refusée. */
export class MediaNotOwnedError extends ForbiddenDomainException {
  constructor() {
    super('You do not have permission to delete this file');
  }
}

export class IpfsStorageUnavailableError extends ValidationDomainException {
  constructor() {
    super('File storage is not configured');
  }
}
