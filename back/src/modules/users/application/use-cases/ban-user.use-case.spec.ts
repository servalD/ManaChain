import { BanUserUseCase } from './ban-user.use-case';
import { InMemoryUserRepository } from '../../infrastructure/in-memory-user.repository';
import { InMemoryUserBanRepository } from '../test-fakes';
import {
  UserAlreadyBannedError,
  UserNotFoundError,
} from '../../domain/user.errors';

describe('BanUserUseCase', () => {
  function setup() {
    const users = new InMemoryUserRepository();
    const bans = new InMemoryUserBanRepository();
    const useCase = new BanUserUseCase(users, bans);
    return { users, bans, useCase };
  }

  it('bans an existing user', async () => {
    const { users, bans, useCase } = setup();
    const target = users.seed();
    const admin = users.seed();

    const ban = await useCase.execute(admin.id, target.id, {
      reason: 'Fraud',
      isPermanent: true,
    });

    expect(ban.userId).toBe(target.id);
    expect(ban.bannedBy).toBe(admin.id);
    expect(await bans.findActive(target.id)).not.toBeNull();
  });

  it('rejects banning a non-existing user', async () => {
    const { useCase, users } = setup();
    const admin = users.seed();
    await expect(
      useCase.execute(admin.id, 'missing-id', {
        reason: 'x',
        isPermanent: true,
      }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('rejects banning an already-banned user', async () => {
    const { users, useCase } = setup();
    const target = users.seed();
    const admin = users.seed();
    await useCase.execute(admin.id, target.id, {
      reason: 'x',
      isPermanent: true,
    });

    await expect(
      useCase.execute(admin.id, target.id, { reason: 'y', isPermanent: true }),
    ).rejects.toThrow(UserAlreadyBannedError);
  });
});
