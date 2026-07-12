import { BrandModuleDeployedHandler } from './brand-module-deployed.handler';
import {
  FakeChainReader,
  FakeTransactionRunner,
  InMemoryBrandContractsRepository,
} from '../test-fakes';
import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { InMemoryBrandRepository } from '../../../brands/infrastructure/in-memory-brand.repository';
import { InMemoryTokenRepository } from '../../../tokens/application/test-fakes';
import type { DecodedLog } from '../../domain/chain-reader';

function log(overrides: Partial<DecodedLog> = {}): DecodedLog {
  return {
    eventName: 'BrandModuleDeployed',
    address: '0xbrandfactory',
    args: {
      brand: '0xBRAND',
      genesisNFT: '0xGENESIS',
      vault: '0xVAULT',
      supportToken: '0xSUPPORT',
    },
    transactionHash: '0xtx1',
    blockNumber: 100n,
    logIndex: 0,
    ...overrides,
  };
}

describe('BrandModuleDeployedHandler', () => {
  const setup = () => {
    const chainReader = new FakeChainReader();
    const brandContracts = new InMemoryBrandContractsRepository();
    const users = new InMemoryUserRepository();
    const brands = new InMemoryBrandRepository();
    const tokens = new InMemoryTokenRepository();
    const handler = new BrandModuleDeployedHandler(
      chainReader,
      brandContracts,
      users,
      brands,
      tokens,
      new FakeTransactionRunner(),
    );
    return { chainReader, brandContracts, users, brands, tokens, handler };
  };

  it('creates brand_contracts with brandId null when the wallet is unlinked', async () => {
    const { brandContracts, handler } = setup();

    await handler.handle(log());

    const row = await brandContracts.findByBrandAddress('0xbrand');
    expect(row).not.toBeNull();
    expect(row?.brandId).toBeNull();
    expect(row?.genesisNftAddress).toBe('0xgenesis');
  });

  it('links the brand and creates its token when the wallet is already linked', async () => {
    const { brandContracts, users, brands, tokens, chainReader, handler } =
      setup();
    const user = users.seed({ blockchainAddress: '0xbrand' });
    const brand = await brands.create({
      ownerId: user.id,
      name: 'Brand',
      country: 'FR',
      headquartersStreet: '1 rue Test',
      headquartersCity: 'Paris',
      headquartersZipCode: '75001',
      interestIds: [],
    });
    chainReader.contractReads.set('0xsupport:symbol', 'BRD');

    await handler.handle(log());

    const row = await brandContracts.findByBrandAddress('0xbrand');
    expect(row?.brandId).toBe(brand.id);
    const token = await tokens.findByBrandId(brand.id);
    expect(token?.symbol).toBe('BRD');
    expect(token?.totalSupply).toBe(0);
  });

  it('is idempotent — replaying the same event is a no-op', async () => {
    const { brandContracts, handler } = setup();
    await handler.handle(log());
    await handler.handle(log());

    const rows = await brandContracts.listSupportTokenAddresses();
    expect(rows).toHaveLength(1);
  });
});
