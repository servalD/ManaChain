import { BrandFlagHandler } from './brand-flag.handler';
import {
  FakeTransactionRunner,
  InMemoryBrandContractsRepository,
} from '../test-fakes';
import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { InMemoryNotificationRepository } from '../../../notifications/application/test-fakes';
import type { DecodedLog } from '../../domain/chain-reader';

describe('BrandFlagHandler', () => {
  it('sets whitelisted from BrandWhitelisted(brand, allowed) and notifies the owner', async () => {
    const brandContracts = new InMemoryBrandContractsRepository();
    const users = new InMemoryUserRepository();
    const notifications = new InMemoryNotificationRepository();
    const owner = users.seed({ blockchainAddress: '0xbrand' });
    const handler = new BrandFlagHandler(
      'BrandWhitelisted',
      'allowed',
      'setWhitelisted',
      brandContracts,
      new FakeTransactionRunner(),
      users,
      notifications,
    );
    brandContracts.seed({ brandAddress: '0xbrand', whitelisted: false });

    const log: DecodedLog = {
      eventName: 'BrandWhitelisted',
      address: '0xmanaadmin',
      args: { brand: '0xbrand', allowed: true },
      transactionHash: '0xtx',
      blockNumber: 1n,
      logIndex: 0,
    };
    await handler.handle(log);

    expect(
      (await brandContracts.findByBrandAddress('0xbrand'))?.whitelisted,
    ).toBe(true);
    const { notifications: list } = await notifications.listByUser(owner.id, {
      limit: 10,
      offset: 0,
    });
    expect(list).toHaveLength(1);
    expect(list[0].type).toBe('brand_whitelisted');
  });

  it('sets blacklisted from BrandBlacklisted(brand, banned) without notifying', async () => {
    const brandContracts = new InMemoryBrandContractsRepository();
    const users = new InMemoryUserRepository();
    const notifications = new InMemoryNotificationRepository();
    const owner = users.seed({ blockchainAddress: '0xbrand' });
    const handler = new BrandFlagHandler(
      'BrandBlacklisted',
      'banned',
      'setBlacklisted',
      brandContracts,
      new FakeTransactionRunner(),
      users,
      notifications,
    );
    brandContracts.seed({ brandAddress: '0xbrand', blacklisted: false });

    const log: DecodedLog = {
      eventName: 'BrandBlacklisted',
      address: '0xmanaadmin',
      args: { brand: '0xbrand', banned: true },
      transactionHash: '0xtx',
      blockNumber: 1n,
      logIndex: 0,
    };
    await handler.handle(log);

    expect(
      (await brandContracts.findByBrandAddress('0xbrand'))?.blacklisted,
    ).toBe(true);
    const { notifications: list } = await notifications.listByUser(owner.id, {
      limit: 10,
      offset: 0,
    });
    expect(list).toHaveLength(0);
  });
});
