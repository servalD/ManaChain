import { SaleStatusHandler } from './sale-status.handler';
import {
  FakeTransactionRunner,
  InMemoryTokenSaleRepository,
} from '../test-fakes';
import type { DecodedLog } from '../../domain/chain-reader';

describe('SaleStatusHandler', () => {
  it('sets the target status on the escrow that emitted the event', async () => {
    const tokenSales = new InMemoryTokenSaleRepository();
    const handler = new SaleStatusHandler(
      'SaleCancelledByAdmin',
      'cancelled_by_admin',
      tokenSales,
      new FakeTransactionRunner(),
    );
    tokenSales.seed({ escrowAddress: '0xescrow', status: 'open' });

    const log: DecodedLog = {
      eventName: 'SaleCancelledByAdmin',
      address: '0xescrow',
      args: {},
      transactionHash: '0xtx',
      blockNumber: 1n,
      logIndex: 0,
    };
    await handler.handle(log);

    expect((await tokenSales.findByEscrowAddress('0xescrow'))?.status).toBe(
      'cancelled_by_admin',
    );
  });
});
