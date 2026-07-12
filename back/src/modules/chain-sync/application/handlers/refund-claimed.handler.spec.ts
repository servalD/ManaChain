import { RefundClaimedHandler } from './refund-claimed.handler';
import {
  FakeTransactionRunner,
  InMemoryTokenSaleRepository,
} from '../test-fakes';
import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { InMemoryTokenTransactionRepository } from '../../../tokens/application/test-fakes';
import type { DecodedLog } from '../../domain/chain-reader';

function log(overrides: Partial<DecodedLog> = {}): DecodedLog {
  return {
    eventName: 'RefundClaimed',
    address: '0xescrow',
    args: {
      user: '0xbuyer',
      tokenAmount: 50_000_000_000_000_000_000n,
      refundAmount: 50_000_000n,
    },
    transactionHash: '0xtx2',
    blockNumber: 200n,
    logIndex: 1,
    ...overrides,
  };
}

describe('RefundClaimedHandler', () => {
  it('records a refund transaction and decreases sold_amount', async () => {
    const tokenSales = new InMemoryTokenSaleRepository();
    const users = new InMemoryUserRepository();
    const transactions = new InMemoryTokenTransactionRepository();
    const handler = new RefundClaimedHandler(
      tokenSales,
      users,
      transactions,
      new FakeTransactionRunner(),
    );
    const sale = tokenSales.seed({
      escrowAddress: '0xescrow',
      soldAmount: '100000000000000000000',
    });
    const buyer = users.seed({ blockchainAddress: '0xbuyer' });

    await handler.handle(log());

    expect(transactions.recorded[0]).toMatchObject({
      tokenId: sale.tokenId,
      fromUserId: buyer.id,
      toUserId: null,
      amount: 50,
      transactionType: 'refund',
      pricePerToken: 1,
    });
    const updated = await tokenSales.findByEscrowAddress('0xescrow');
    expect(updated?.soldAmount).toBe('50000000000000000000');
  });
});
