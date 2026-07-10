import { MarkNotificationReadUseCase } from './mark-notification-read.use-case';
import { InMemoryNotificationRepository } from '../test-fakes';
import { NotificationNotFoundError } from '../../domain/notification.errors';

describe('MarkNotificationReadUseCase', () => {
  it('marks the caller’s own notification as read', async () => {
    const notifications = new InMemoryNotificationRepository();
    const useCase = new MarkNotificationReadUseCase(notifications);
    const created = await notifications.create({
      userId: 'user-1',
      type: 'admin_message',
      title: 't',
      body: 'b',
    });

    const updated = await useCase.execute('user-1', created.id);
    expect(updated.readAt).not.toBeNull();
  });

  it('rejects marking another user’s notification as read', async () => {
    const notifications = new InMemoryNotificationRepository();
    const useCase = new MarkNotificationReadUseCase(notifications);
    const created = await notifications.create({
      userId: 'user-1',
      type: 'admin_message',
      title: 't',
      body: 'b',
    });

    await expect(useCase.execute('user-2', created.id)).rejects.toThrow(
      NotificationNotFoundError,
    );
  });
});
