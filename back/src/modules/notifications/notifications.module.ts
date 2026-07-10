import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { NotificationOrmEntity } from './infrastructure/notification.orm-entity';
import { TypeOrmNotificationRepository } from './infrastructure/typeorm-notification.repository';
import { NotificationRepository } from './domain/notification.repository';
import { SendNotificationUseCase } from './application/use-cases/send-notification.use-case';
import { ListMyNotificationsUseCase } from './application/use-cases/list-my-notifications.use-case';
import { MarkNotificationReadUseCase } from './application/use-cases/mark-notification-read.use-case';
import { NotificationsController } from './presentation/notifications.controller';

/**
 * Centre de notifications : simple, en DB, pas de temps réel. `NotificationRepository`
 * est exporté pour être réutilisé directement par `chain-sync` (ex. notifier le
 * propriétaire d'une marque whitelistée) — même schéma de délégation que
 * `EventRepository` (Phase 4) plutôt qu'un port `NotificationPublisher` séparé.
 */
@Module({
  imports: [TypeOrmModule.forFeature([NotificationOrmEntity]), UsersModule],
  controllers: [NotificationsController],
  providers: [
    {
      provide: NotificationRepository,
      useClass: TypeOrmNotificationRepository,
    },
    SendNotificationUseCase,
    ListMyNotificationsUseCase,
    MarkNotificationReadUseCase,
  ],
  exports: [NotificationRepository],
})
export class NotificationsModule {}
