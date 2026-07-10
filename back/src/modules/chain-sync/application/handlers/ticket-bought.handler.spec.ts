import { TicketBoughtHandler } from './ticket-bought.handler';
import {
  FakeTransactionRunner,
  InMemoryEventTicketPurchaseRepository,
} from '../test-fakes';
import { InMemoryEventRepository } from '../../../events/application/test-fakes';
import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { InMemoryBrandRepository } from '../../../brands/infrastructure/in-memory-brand.repository';
import { InMemoryNotificationRepository } from '../../../notifications/application/test-fakes';
import type { DecodedLog } from '../../domain/chain-reader';

function log(overrides: Partial<DecodedLog> = {}): DecodedLog {
  return {
    eventName: 'Bought',
    address: '0xticketsale',
    args: { buyer: '0xbuyer', tokenId: 1n, quantity: 2n, paid: 10_000_000n },
    transactionHash: '0xtx',
    blockNumber: 1n,
    logIndex: 3,
    ...overrides,
  };
}

describe('TicketBoughtHandler', () => {
  it('records the purchase, resolving the buyer when known', async () => {
    const events = new InMemoryEventRepository();
    const users = new InMemoryUserRepository();
    const purchases = new InMemoryEventTicketPurchaseRepository();
    const brands = new InMemoryBrandRepository();
    const notifications = new InMemoryNotificationRepository();
    const handler = new TicketBoughtHandler(
      events,
      users,
      purchases,
      brands,
      notifications,
      new FakeTransactionRunner(),
    );
    const event = events.seed({ ticketSaleAddress: '0xticketsale' });
    const buyer = users.seed({ blockchainAddress: '0xbuyer' });

    await handler.handle(log());

    expect(purchases.recorded).toHaveLength(1);
    expect(purchases.recorded[0]).toMatchObject({
      eventId: event.id,
      tokenId: '1',
      buyerAddress: '0xbuyer',
      userId: buyer.id,
      quantity: 2,
      paid: '10000000',
      txHash: '0xtx',
      logIndex: 3,
    });
  });

  it('records userId=null when the buyer is not a known user', async () => {
    const events = new InMemoryEventRepository();
    const users = new InMemoryUserRepository();
    const purchases = new InMemoryEventTicketPurchaseRepository();
    const brands = new InMemoryBrandRepository();
    const notifications = new InMemoryNotificationRepository();
    const handler = new TicketBoughtHandler(
      events,
      users,
      purchases,
      brands,
      notifications,
      new FakeTransactionRunner(),
    );
    events.seed({ ticketSaleAddress: '0xticketsale' });

    await handler.handle(log());

    expect(purchases.recorded[0].userId).toBeNull();
  });

  it('notifies the brand owner of the ticket purchase', async () => {
    const events = new InMemoryEventRepository();
    const users = new InMemoryUserRepository();
    const purchases = new InMemoryEventTicketPurchaseRepository();
    const brands = new InMemoryBrandRepository();
    const notifications = new InMemoryNotificationRepository();
    const handler = new TicketBoughtHandler(
      events,
      users,
      purchases,
      brands,
      notifications,
      new FakeTransactionRunner(),
    );
    const brand = await brands.create({
      ownerId: 'owner-1',
      name: 'Brand',
      country: 'FR',
      headquartersStreet: '1 rue',
      headquartersCity: 'Paris',
      headquartersZipCode: '75000',
      interestIds: [],
    });
    events.seed({ ticketSaleAddress: '0xticketsale', brandId: brand.id });

    await handler.handle(log());

    const { notifications: list } = await notifications.listByUser('owner-1', {
      limit: 10,
      offset: 0,
    });
    expect(list).toHaveLength(1);
    expect(list[0].type).toBe('ticket_purchased');
  });

  it('skips silently when the ticket sale is unknown', async () => {
    const events = new InMemoryEventRepository();
    const users = new InMemoryUserRepository();
    const purchases = new InMemoryEventTicketPurchaseRepository();
    const brands = new InMemoryBrandRepository();
    const notifications = new InMemoryNotificationRepository();
    const handler = new TicketBoughtHandler(
      events,
      users,
      purchases,
      brands,
      notifications,
      new FakeTransactionRunner(),
    );

    await handler.handle(log());

    expect(purchases.recorded).toHaveLength(0);
  });
});
