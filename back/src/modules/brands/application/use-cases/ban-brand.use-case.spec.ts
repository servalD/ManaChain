import { BanBrandUseCase } from './ban-brand.use-case';
import { InMemoryBrandRepository } from '../../infrastructure/in-memory-brand.repository';
import { InMemoryBrandBanRepository } from '../test-fakes';
import { InMemoryNotificationRepository } from '../../../notifications/application/test-fakes';
import {
  BrandAlreadyBannedError,
  BrandNotFoundError,
} from '../../domain/brand.errors';

describe('BanBrandUseCase', () => {
  const brandInput = {
    ownerId: 'owner-1',
    name: 'BrandCo',
    country: 'FR',
    headquartersStreet: '1 rue X',
    headquartersCity: 'Paris',
    headquartersZipCode: '75001',
    interestIds: [],
  };

  function setup() {
    const brands = new InMemoryBrandRepository();
    const bans = new InMemoryBrandBanRepository();
    const notifications = new InMemoryNotificationRepository();
    const useCase = new BanBrandUseCase(brands, bans, notifications);
    return { brands, bans, notifications, useCase };
  }

  it('bans an existing brand and notifies its owner', async () => {
    const { brands, bans, notifications, useCase } = setup();
    const brand = await brands.create(brandInput);

    const ban = await useCase.execute('admin-1', brand.id, {
      reason: 'Fraud',
      isPermanent: true,
    });

    expect(ban.brandId).toBe(brand.id);
    expect(await bans.findActive(brand.id)).not.toBeNull();
    const { notifications: list } = await notifications.listByUser('owner-1', {
      limit: 10,
      offset: 0,
    });
    expect(list).toHaveLength(1);
    expect(list[0].type).toBe('brand_banned');
  });

  it('rejects banning a non-existing brand', async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute('admin-1', 'missing-id', {
        reason: 'x',
        isPermanent: true,
      }),
    ).rejects.toThrow(BrandNotFoundError);
  });

  it('rejects banning an already-banned brand', async () => {
    const { brands, useCase } = setup();
    const brand = await brands.create(brandInput);
    await useCase.execute('admin-1', brand.id, {
      reason: 'x',
      isPermanent: true,
    });

    await expect(
      useCase.execute('admin-1', brand.id, { reason: 'y', isPermanent: true }),
    ).rejects.toThrow(BrandAlreadyBannedError);
  });
});
