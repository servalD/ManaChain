import { TokenSaleDeployedHandler } from './token-sale-deployed.handler';
import {
  FakeTransactionRunner,
  InMemoryBrandContractsRepository,
  InMemoryTokenSaleRepository,
} from '../test-fakes';
import { InMemoryTokenRepository } from '../../../tokens/application/test-fakes';
import type { DecodedLog } from '../../domain/chain-reader';

function log(overrides: Partial<DecodedLog> = {}): DecodedLog {
  return {
    eventName: 'TokenSaleDeployed',
    address: '0xsalefactory',
    args: {
      brand: '0xbrand',
      escrow: '0xescrow',
      supportToken: '0xsupport',
      pricePerToken: 1_000_000n,
      totalForSale: 1_000_000_000_000_000_000_000n,
      startTime: 1_700_000_000n,
      endTime: 1_800_000_000n,
    },
    transactionHash: '0xtx1',
    blockNumber: 100n,
    logIndex: 0,
    ...overrides,
  };
}

describe('TokenSaleDeployedHandler', () => {
  it('creates the token_sale row when the brand_token is already resolved', async () => {
    const brandContracts = new InMemoryBrandContractsRepository();
    const tokens = new InMemoryTokenRepository();
    const tokenSales = new InMemoryTokenSaleRepository();
    const handler = new TokenSaleDeployedHandler(
      brandContracts,
      tokens,
      tokenSales,
      new FakeTransactionRunner(),
    );

    const contracts = brandContracts.seed({
      brandAddress: '0xbrand',
      brandId: 'brand-1',
    });
    const token = tokens.seed({ brandId: contracts.brandId! });

    await handler.handle(log());

    const sale = await tokenSales.findByEscrowAddress('0xescrow');
    expect(sale?.tokenId).toBe(token.id);
    expect(sale?.pricePerToken).toBe('1000000');
    expect(sale?.status).toBe('open');
  });

  it('skips silently when the brand_token cannot be resolved', async () => {
    const brandContracts = new InMemoryBrandContractsRepository();
    const tokens = new InMemoryTokenRepository();
    const tokenSales = new InMemoryTokenSaleRepository();
    const handler = new TokenSaleDeployedHandler(
      brandContracts,
      tokens,
      tokenSales,
      new FakeTransactionRunner(),
    );

    await handler.handle(log());

    expect(await tokenSales.findByEscrowAddress('0xescrow')).toBeNull();
  });

  it('is idempotent — replaying the same escrow is a no-op', async () => {
    const brandContracts = new InMemoryBrandContractsRepository();
    const tokens = new InMemoryTokenRepository();
    const tokenSales = new InMemoryTokenSaleRepository();
    const handler = new TokenSaleDeployedHandler(
      brandContracts,
      tokens,
      tokenSales,
      new FakeTransactionRunner(),
    );
    const contracts = brandContracts.seed({
      brandAddress: '0xbrand',
      brandId: 'brand-1',
    });
    tokens.seed({ brandId: contracts.brandId! });

    await handler.handle(log());
    await handler.handle(log());

    expect(await tokenSales.listAllEscrowAddresses()).toHaveLength(1);
  });
});
