import { PriceSetHandler } from './price-set.handler';
import {
  FakeTransactionRunner,
  InMemoryEventTicketTypeRepository,
} from '../test-fakes';
import { InMemoryEventRepository } from '../../../events/application/test-fakes';
import type { DecodedLog } from '../../domain/chain-reader';

function log(overrides: Partial<DecodedLog> = {}): DecodedLog {
  return {
    eventName: 'PriceSet',
    address: '0xticketsale',
    args: { tokenId: 1n, price: 5_000_000n },
    transactionHash: '0xtx',
    blockNumber: 1n,
    logIndex: 0,
    ...overrides,
  };
}

describe('PriceSetHandler', () => {
  it('upserts the ticket type price for the matching event', async () => {
    const events = new InMemoryEventRepository();
    const ticketTypes = new InMemoryEventTicketTypeRepository();
    const handler = new PriceSetHandler(
      events,
      ticketTypes,
      new FakeTransactionRunner(),
    );
    const event = events.seed({ ticketSaleAddress: '0xticketsale' });

    await handler.handle(log());

    const type = await ticketTypes.findByEventAndToken(event.id, '1');
    expect(type?.price).toBe('5000000');
  });

  it('skips silently when the ticket sale is unknown', async () => {
    const events = new InMemoryEventRepository();
    const ticketTypes = new InMemoryEventTicketTypeRepository();
    const handler = new PriceSetHandler(
      events,
      ticketTypes,
      new FakeTransactionRunner(),
    );

    await handler.handle(log());

    expect(await ticketTypes.listByEvent('unknown')).toHaveLength(0);
  });
});
