import { Injectable } from '@nestjs/common';
import {
  ListNotificationsResult,
  NotificationRepository,
} from '../../domain/notification.repository';
import { ListNotificationsQuery } from '../dto/list-notifications.query';

@Injectable()
export class ListMyNotificationsUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  execute(
    userId: string,
    query: ListNotificationsQuery,
  ): Promise<ListNotificationsResult> {
    return this.notifications.listByUser(userId, query);
  }
}
