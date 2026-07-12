import { randomUUID } from 'node:crypto';
import { Notification } from '../domain/notification';
import {
  CreateNotificationParams,
  ListNotificationsParams,
  ListNotificationsResult,
  NotificationRepository,
} from '../domain/notification.repository';
import { NotificationNotFoundError } from '../domain/notification.errors';

/** Fake en mémoire pour les tests unitaires (use-cases). */
export class InMemoryNotificationRepository extends NotificationRepository {
  private readonly notifications = new Map<string, Notification>();

  create(params: CreateNotificationParams): Promise<Notification> {
    const notification = new Notification(
      randomUUID(),
      params.userId,
      params.type,
      params.title,
      params.body,
      null,
      params.createdBy ?? null,
      new Date(),
    );
    this.notifications.set(notification.id, notification);
    return Promise.resolve(notification);
  }

  async createMany(params: CreateNotificationParams[]): Promise<void> {
    for (const p of params) {
      await this.create(p);
    }
  }

  listByUser(
    userId: string,
    params: ListNotificationsParams,
  ): Promise<ListNotificationsResult> {
    const all = [...this.notifications.values()]
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = all.length;
    const unreadCount = all.filter((n) => !n.readAt).length;
    const notifications = all.slice(
      params.offset,
      params.offset + params.limit,
    );
    return Promise.resolve({ notifications, total, unreadCount });
  }

  markRead(id: string, userId: string): Promise<Notification> {
    const notification = this.notifications.get(id);
    if (!notification || notification.userId !== userId) {
      return Promise.reject(new NotificationNotFoundError());
    }
    if (notification.readAt) return Promise.resolve(notification);
    const updated = new Notification(
      notification.id,
      notification.userId,
      notification.type,
      notification.title,
      notification.body,
      new Date(),
      notification.createdBy,
      notification.createdAt,
    );
    this.notifications.set(id, updated);
    return Promise.resolve(updated);
  }
}
