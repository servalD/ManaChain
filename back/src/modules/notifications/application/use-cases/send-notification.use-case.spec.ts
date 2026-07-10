import { SendNotificationUseCase } from './send-notification.use-case';
import { InMemoryNotificationRepository } from '../test-fakes';
import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { InvalidNotificationRecipientError } from '../../domain/notification.errors';
import { Role } from '../../../../shared/enums/role.enum';

describe('SendNotificationUseCase', () => {
  function setup() {
    const notifications = new InMemoryNotificationRepository();
    const users = new InMemoryUserRepository();
    const useCase = new SendNotificationUseCase(notifications, users);
    return { notifications, users, useCase };
  }

  it('sends to a single user', async () => {
    const { notifications, users, useCase } = setup();
    const target = users.seed({ role: Role.CLIENT });
    const admin = users.seed({ role: Role.ADMIN });

    const count = await useCase.execute(admin.id, {
      recipientType: 'user',
      userId: target.id,
      title: 'Hello',
      body: 'World',
    });

    expect(count).toBe(1);
    const { notifications: list } = await notifications.listByUser(target.id, {
      limit: 10,
      offset: 0,
    });
    expect(list).toHaveLength(1);
    expect(list[0].createdBy).toBe(admin.id);
    expect(list[0].type).toBe('admin_message');
  });

  it('sends to every user of a role and skips other roles', async () => {
    const { notifications, users, useCase } = setup();
    const brand1 = users.seed({ role: Role.BRANDUSER });
    const brand2 = users.seed({ role: Role.BRANDUSER });
    const client = users.seed({ role: Role.CLIENT });
    const admin = users.seed({ role: Role.ADMIN });

    const count = await useCase.execute(admin.id, {
      recipientType: 'role',
      role: Role.BRANDUSER,
      title: 'Hello brands',
      body: 'World',
    });

    expect(count).toBe(2);
    expect(
      (await notifications.listByUser(brand1.id, { limit: 10, offset: 0 }))
        .notifications,
    ).toHaveLength(1);
    expect(
      (await notifications.listByUser(brand2.id, { limit: 10, offset: 0 }))
        .notifications,
    ).toHaveLength(1);
    expect(
      (await notifications.listByUser(client.id, { limit: 10, offset: 0 }))
        .notifications,
    ).toHaveLength(0);
  });

  it('sends to everyone when recipientType is "all"', async () => {
    const { notifications, users, useCase } = setup();
    const a = users.seed({ role: Role.CLIENT });
    const b = users.seed({ role: Role.BRANDUSER });
    const admin = users.seed({ role: Role.ADMIN });

    const count = await useCase.execute(admin.id, {
      recipientType: 'all',
      title: 'Hello everyone',
      body: 'World',
    });

    expect(count).toBe(3); // a, b, admin (broadcast reaches admins too)
    expect(
      (await notifications.listByUser(a.id, { limit: 10, offset: 0 }))
        .notifications,
    ).toHaveLength(1);
    expect(
      (await notifications.listByUser(b.id, { limit: 10, offset: 0 }))
        .notifications,
    ).toHaveLength(1);
  });

  it('rejects recipientType "user" without a userId', async () => {
    const { users, useCase } = setup();
    const admin = users.seed({ role: Role.ADMIN });
    await expect(
      useCase.execute(admin.id, {
        recipientType: 'user',
        title: 'x',
        body: 'y',
      }),
    ).rejects.toThrow(InvalidNotificationRecipientError);
  });

  it('rejects recipientType "role" without a role', async () => {
    const { users, useCase } = setup();
    const admin = users.seed({ role: Role.ADMIN });
    await expect(
      useCase.execute(admin.id, {
        recipientType: 'role',
        title: 'x',
        body: 'y',
      }),
    ).rejects.toThrow(InvalidNotificationRecipientError);
  });
});
