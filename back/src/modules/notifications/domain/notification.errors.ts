import {
  NotFoundDomainException,
  ValidationDomainException,
} from '../../../shared/domain/domain.exception';

export class NotificationNotFoundError extends NotFoundDomainException {
  constructor() {
    super('Notification not found');
  }
}

/** Body de `POST /notifications` incohérent (ex : `recipientType: 'user'` sans `userId`). */
export class InvalidNotificationRecipientError extends ValidationDomainException {
  constructor(message: string) {
    super(message);
  }
}
