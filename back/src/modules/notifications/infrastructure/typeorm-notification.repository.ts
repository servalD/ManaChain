import { Injectable } from '@nestjs/common';
import { IsNull, Repository } from 'typeorm';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
import { Notification } from '../domain/notification';
import { NotificationNotFoundError } from '../domain/notification.errors';
import {
  CreateNotificationParams,
  ListNotificationsParams,
  ListNotificationsResult,
  NotificationRepository,
} from '../domain/notification.repository';
import { NotificationOrmEntity } from './notification.orm-entity';

@Injectable()
export class TypeOrmNotificationRepository extends NotificationRepository {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  private get repository(): Repository<NotificationOrmEntity> {
    return this.db.getRepository(NotificationOrmEntity);
  }

  async create(params: CreateNotificationParams): Promise<Notification> {
    const saved = await this.repository.save(
      this.repository.create({
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        createdBy: params.createdBy ?? null,
        readAt: null,
      }),
    );
    return this.toDomain(saved);
  }

  async createMany(params: CreateNotificationParams[]): Promise<void> {
    if (params.length === 0) return;
    await this.repository.insert(
      params.map((p) => ({
        userId: p.userId,
        type: p.type,
        title: p.title,
        body: p.body,
        createdBy: p.createdBy ?? null,
        readAt: null,
      })),
    );
  }

  async listByUser(
    userId: string,
    params: ListNotificationsParams,
  ): Promise<ListNotificationsResult> {
    const [entities, total] = await this.repository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: params.offset,
      take: params.limit,
    });
    const unreadCount = await this.repository.count({
      where: { userId, readAt: IsNull() },
    });
    return {
      notifications: entities.map((e) => this.toDomain(e)),
      total,
      unreadCount,
    };
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const entity = await this.repository.findOne({ where: { id, userId } });
    if (!entity) throw new NotificationNotFoundError();
    if (!entity.readAt) {
      entity.readAt = new Date();
      await this.repository.save(entity);
    }
    return this.toDomain(entity);
  }

  private toDomain(e: NotificationOrmEntity): Notification {
    return new Notification(
      e.id,
      e.userId,
      e.type,
      e.title,
      e.body,
      e.readAt,
      e.createdBy,
      e.createdAt,
    );
  }
}
