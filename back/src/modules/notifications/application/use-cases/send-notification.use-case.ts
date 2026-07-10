import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../../domain/notification.repository';
import { InvalidNotificationRecipientError } from '../../domain/notification.errors';
import { UserRepository } from '../../../users/domain/user.repository';
import { SendNotificationRequest } from '../dto/send-notification.request';

/**
 * Envoi admin : destinataire unique, tous les utilisateurs d'un rôle, ou tout
 * le monde. Résout la liste d'ids côté back (jamais côté front) puis fan-out
 * en une seule insertion batch.
 */
@Injectable()
export class SendNotificationUseCase {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    adminId: string,
    body: SendNotificationRequest,
  ): Promise<number> {
    let recipientIds: string[];
    if (body.recipientType === 'user') {
      if (!body.userId) {
        throw new InvalidNotificationRecipientError(
          'userId is required when recipientType is "user"',
        );
      }
      recipientIds = [body.userId];
    } else if (body.recipientType === 'role') {
      if (!body.role) {
        throw new InvalidNotificationRecipientError(
          'role is required when recipientType is "role"',
        );
      }
      recipientIds = await this.userRepository.listIds(body.role);
    } else {
      recipientIds = await this.userRepository.listIds();
    }

    await this.notifications.createMany(
      recipientIds.map((userId) => ({
        userId,
        type: 'admin_message' as const,
        title: body.title,
        body: body.body,
        createdBy: adminId,
      })),
    );
    return recipientIds.length;
  }
}
