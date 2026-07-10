import { ApiProperty } from '@nestjs/swagger';
import { Notification } from '../domain/notification';
import type { NotificationType } from '../domain/notification';

export class NotificationResponse {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    enum: ['admin_message', 'brand_whitelisted', 'brand_banned'],
  })
  type: NotificationType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  readAt: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;
}

export class PaginatedNotificationsResponse {
  @ApiProperty({ type: NotificationResponse, isArray: true })
  notifications: NotificationResponse[];

  @ApiProperty() total: number;
  @ApiProperty() unreadCount: number;
}

export class SendNotificationResponse {
  @ApiProperty() recipientCount: number;
}

export const toNotificationResponse = (
  notification: Notification,
): NotificationResponse => ({
  id: notification.id,
  type: notification.type,
  title: notification.title,
  body: notification.body,
  readAt: notification.readAt ? notification.readAt.toISOString() : null,
  createdAt: notification.createdAt.toISOString(),
});
