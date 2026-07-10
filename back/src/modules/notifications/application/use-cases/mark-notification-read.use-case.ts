import { Injectable } from '@nestjs/common';
import { Notification } from '../../domain/notification';
import { NotificationRepository } from '../../domain/notification.repository';

@Injectable()
export class MarkNotificationReadUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  execute(userId: string, notificationId: string): Promise<Notification> {
    return this.notifications.markRead(notificationId, userId);
  }
}
