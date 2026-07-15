import {
  ForbiddenDomainException,
  NotFoundDomainException,
  ValidationDomainException,
} from '../../../shared/domain/domain.exception';

export class EventNotFoundError extends NotFoundDomainException {
  constructor() {
    super('Event not found');
  }
}

export class NotEventOwnerError extends ForbiddenDomainException {
  constructor() {
    super('You do not have permission to modify this event');
  }
}

export class BrandRequiredError extends NotFoundDomainException {
  constructor() {
    super('You must have a brand to create an event');
  }
}

/** `event_contracts.brand_address` ne correspond pas à l'adresse liée du brand appelant. */
export class EventContractsNotFoundError extends NotFoundDomainException {
  constructor() {
    super('No deployed event module found for this address yet');
  }
}

export class EventContractsOwnershipMismatchError extends ForbiddenDomainException {
  constructor() {
    super('This on-chain event module was not deployed by your wallet');
  }
}

export class EventAlreadyPublishedError extends ValidationDomainException {
  constructor() {
    super('This event is already published');
  }
}

export class EventNotReadyToPublishError extends ValidationDomainException {
  constructor() {
    super('Deploy the ticket sale before publishing this event');
  }
}

export class EventCannotBeCancelledError extends ValidationDomainException {
  constructor() {
    super('This event cannot be cancelled');
  }
}

export class EventEndBeforeStartError extends ValidationDomainException {
  constructor() {
    super('End date must be on or after the start date');
  }
}
