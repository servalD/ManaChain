import { BrandFlagHandler } from './brand-flag.handler';
import {
  FakeTransactionRunner,
  InMemoryBrandContractsRepository,
} from '../test-fakes';
import type { DecodedLog } from '../../domain/chain-reader';

describe('BrandFlagHandler', () => {
  it('sets whitelisted from BrandWhitelisted(brand, allowed)', async () => {
    const brandContracts = new InMemoryBrandContractsRepository();
    const handler = new BrandFlagHandler(
      'BrandWhitelisted',
      'allowed',
      'setWhitelisted',
      brandContracts,
      new FakeTransactionRunner(),
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
  });

  it('sets blacklisted from BrandBlacklisted(brand, banned)', async () => {
    const brandContracts = new InMemoryBrandContractsRepository();
    const handler = new BrandFlagHandler(
      'BrandBlacklisted',
      'banned',
      'setBlacklisted',
      brandContracts,
      new FakeTransactionRunner(),
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
  });
});
