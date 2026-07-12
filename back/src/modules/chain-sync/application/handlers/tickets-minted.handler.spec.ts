import { TicketsMintedHandler } from './tickets-minted.handler';
import {
  FakeTransactionRunner,
  InMemoryEventTicketTypeRepository,
} from '../test-fakes';
import { InMemoryEventRepository } from '../../../events/application/test-fakes';
import type { DecodedLog } from '../../domain/chain-reader';

function log(overrides: Partial<DecodedLog> = {}): DecodedLog {
  return {
    eventName: 'TicketsMinted',
    address: '0xtickets',
    args: { to: '0xticketsale', tokenId: 1n, amount: 50n },
    transactionHash: '0xtx',
    blockNumber: 1n,
    logIndex: 0,
    ...overrides,
  };
}

describe('TicketsMintedHandler', () => {
  it('increases minted_quantity when minting to the ticket sale', async () => {
    const events = new InMemoryEventRepository();
    const ticketTypes = new InMemoryEventTicketTypeRepository();
    const handler = new TicketsMintedHandler(
      events,
      ticketTypes,
      new FakeTransactionRunner(),
    );
    const event = events.seed({
      eventTicketsAddress: '0xtickets',
      ticketSaleAddress: '0xticketsale',
    });

    await handler.handle(log());

    expect(
      (await ticketTypes.findByEventAndToken(event.id, '1'))?.mintedQuantity,
    ).toBe(50);
  });

  it('ignores mints to any address other than the ticket sale', async () => {
    const events = new InMemoryEventRepository();
    const ticketTypes = new InMemoryEventTicketTypeRepository();
    const handler = new TicketsMintedHandler(
      events,
      ticketTypes,
      new FakeTransactionRunner(),
    );
    const event = events.seed({
      eventTicketsAddress: '0xtickets',
      ticketSaleAddress: '0xticketsale',
    });

    await handler.handle(
      log({ args: { to: '0xsomeoneelse', tokenId: 1n, amount: 50n } }),
    );

    expect(await ticketTypes.findByEventAndToken(event.id, '1')).toBeNull();
  });
});
