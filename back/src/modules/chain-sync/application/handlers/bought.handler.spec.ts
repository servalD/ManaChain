import { BoughtHandler } from './bought.handler';
import {
  FakeTransactionRunner,
  InMemoryTokenSaleRepository,
} from '../test-fakes';
import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import {
  InMemoryTokenRepository,
  InMemoryTokenTransactionRepository,
} from '../../../tokens/application/test-fakes';
import { InMemoryBrandRepository } from '../../../brands/infrastructure/in-memory-brand.repository';
import { InMemoryNotificationRepository } from '../../../notifications/application/test-fakes';
import type { DecodedLog } from '../../domain/chain-reader';

function log(overrides: Partial<DecodedLog> = {}): DecodedLog {
  return {
    eventName: 'Bought',
    address: '0xescrow',
    args: {
      buyer: '0xbuyer',
      amount: 100_000_000_000_000_000_000n, // 100 tokens (18 dec)
      paid: 100_000_000n, // 100 USDC (6 dec)
    },
    transactionHash: '0xtx1',
    blockNumber: 100n,
    logIndex: 2,
    ...overrides,
  };
}

describe('BoughtHandler', () => {
  const setup = () => {
    const tokenSales = new InMemoryTokenSaleRepository();
    const users = new InMemoryUserRepository();
    const tokens = new InMemoryTokenRepository();
    const transactions = new InMemoryTokenTransactionRepository();
    const brands = new InMemoryBrandRepository();
    const notifications = new InMemoryNotificationRepository();
    const handler = new BoughtHandler(
      tokenSales,
      users,
      tokens,
      transactions,
      brands,
      notifications,
      new FakeTransactionRunner(),
    );
    return {
      tokenSales,
      users,
      tokens,
      transactions,
      brands,
      notifications,
      handler,
    };
  };

  it('records a purchase transaction and increases sold_amount', async () => {
    const { tokenSales, users, transactions, handler } = setup();
    const sale = tokenSales.seed({ escrowAddress: '0xescrow' });
    const buyer = users.seed({ blockchainAddress: '0xbuyer' });

    await handler.handle(log());

    expect(transactions.recorded).toHaveLength(1);
    expect(transactions.recorded[0]).toMatchObject({
      tokenId: sale.tokenId,
      toUserId: buyer.id,
      amount: 100,
      transactionType: 'purchase',
      pricePerToken: 1,
      txHash: '0xtx1',
      logIndex: 2,
    });
    const updated = await tokenSales.findByEscrowAddress('0xescrow');
    expect(updated?.soldAmount).toBe('100000000000000000000');
  });

  it('notifies the brand owner of the purchase', async () => {
    const { tokenSales, tokens, brands, notifications, handler } = setup();
    const brand = await brands.create({
      ownerId: 'owner-1',
      name: 'Brand',
      country: 'FR',
      headquartersStreet: '1 rue',
      headquartersCity: 'Paris',
      headquartersZipCode: '75000',
      interestIds: [],
    });
    const token = tokens.seed({ brandId: brand.id, symbol: 'BRD' });
    tokenSales.seed({ escrowAddress: '0xescrow', tokenId: token.id });

    await handler.handle(log());

    const { notifications: list } = await notifications.listByUser('owner-1', {
      limit: 10,
      offset: 0,
    });
    expect(list).toHaveLength(1);
    expect(list[0].type).toBe('token_purchased');
  });

  it('records toUserId=null when the buyer is not a known user', async () => {
    const { tokenSales, transactions, handler } = setup();
    tokenSales.seed({ escrowAddress: '0xescrow' });

    await handler.handle(log());

    expect(transactions.recorded[0].toUserId).toBeNull();
    expect(transactions.recorded[0].toAddress).toBe('0xbuyer');
  });

  it('skips silently when the escrow is unknown', async () => {
    const { transactions, handler } = setup();
    await handler.handle(log());
    expect(transactions.recorded).toHaveLength(0);
  });
});
