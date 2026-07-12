import { Notification, NotificationType } from './notification';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  createdBy?: string | null;
}

export interface ListNotificationsParams {
  limit: number;
  offset: number;
}

export interface ListNotificationsResult {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

/**
 * Repository PORT (hexagonal) de la table `notification`. Utilisé comme token
 * DI ; l'adapter TypeORM vit dans la couche infrastructure et est lié dans
 * {@link NotificationsModule}. `createMany` sert au fan-out (broadcast admin).
 */
export abstract class NotificationRepository {
  abstract create(params: CreateNotificationParams): Promise<Notification>;
  abstract createMany(params: CreateNotificationParams[]): Promise<void>;
  abstract listByUser(
    userId: string,
    params: ListNotificationsParams,
  ): Promise<ListNotificationsResult>;
  abstract markRead(id: string, userId: string): Promise<Notification>;
}
