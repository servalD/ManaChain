import { SaleStatusHandler } from './sale-status.handler';
import {
  FakeTransactionRunner,
  InMemoryTokenSaleRepository,
} from '../test-fakes';
import { InMemoryTokenHolderRepository } from '../../../tokens/application/test-fakes';
import { InMemoryNotificationRepository } from '../../../notifications/application/test-fakes';
import type { DecodedLog } from '../../domain/chain-reader';

describe('SaleStatusHandler', () => {
  it('sets the target status on the escrow that emitted the event', async () => {
    const tokenSales = new InMemoryTokenSaleRepository();
    const tokenHolders = new InMemoryTokenHolderRepository();
    const notifications = new InMemoryNotificationRepository();
    const handler = new SaleStatusHandler(
      'SaleCancelledByAdmin',
      'cancelled_by_admin',
      tokenSales,
      tokenHolders,
      notifications,
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

  it('does not notify holders for cancelled_by_admin (already notified via BanBrandUseCase)', async () => {
    const tokenSales = new InMemoryTokenSaleRepository();
    const tokenHolders = new InMemoryTokenHolderRepository();
    const notifications = new InMemoryNotificationRepository();
    const handler = new SaleStatusHandler(
      'SaleCancelledByAdmin',
      'cancelled_by_admin',
      tokenSales,
      tokenHolders,
      notifications,
      new FakeTransactionRunner(),
    );
    const sale = tokenSales.seed({ escrowAddress: '0xescrow', status: 'open' });
    await tokenHolders.setBalance('holder-1', sale.tokenId, 10);

    await handler.handle({
      eventName: 'SaleCancelledByAdmin',
      address: '0xescrow',
      args: {},
      transactionHash: '0xtx',
      blockNumber: 1n,
      logIndex: 0,
    });

    const { notifications: list } = await notifications.listByUser('holder-1', {
      limit: 10,
      offset: 0,
    });
    expect(list).toHaveLength(0);
  });

  it('notifies every holder for cancelled_by_brand so they can claim a refund', async () => {
    const tokenSales = new InMemoryTokenSaleRepository();
    const tokenHolders = new InMemoryTokenHolderRepository();
    const notifications = new InMemoryNotificationRepository();
    const handler = new SaleStatusHandler(
      'SaleCancelledByBrand',
      'cancelled_by_brand',
      tokenSales,
      tokenHolders,
      notifications,
      new FakeTransactionRunner(),
    );
    const sale = tokenSales.seed({ escrowAddress: '0xescrow', status: 'open' });
    await tokenHolders.setBalance('holder-1', sale.tokenId, 10);
    await tokenHolders.setBalance('holder-2', sale.tokenId, 5);

    await handler.handle({
      eventName: 'SaleCancelledByBrand',
      address: '0xescrow',
      args: {},
      transactionHash: '0xtx',
      blockNumber: 1n,
      logIndex: 0,
    });

    for (const userId of ['holder-1', 'holder-2']) {
      const { notifications: list } = await notifications.listByUser(userId, {
        limit: 10,
        offset: 0,
      });
      expect(list).toHaveLength(1);
      expect(list[0].type).toBe('sale_cancelled_by_brand');
    }
  });
});
