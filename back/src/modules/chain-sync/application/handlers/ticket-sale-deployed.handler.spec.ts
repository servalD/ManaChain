import { TicketSaleDeployedHandler } from './ticket-sale-deployed.handler';
import {
  FakeTransactionRunner,
  InMemoryEventContractsRepository,
} from '../test-fakes';
import type { DecodedLog } from '../../domain/chain-reader';

function log(overrides: Partial<DecodedLog> = {}): DecodedLog {
  return {
    eventName: 'TicketSaleDeployed',
    address: '0xsalefactory',
    args: {
      brand: '0xbrand',
      ticketSale: '0xTICKETSALE',
      eventTickets: '0xTICKETS',
      paymentToken: '0xusdc',
      startTime: 1n,
      endTime: 2n,
    },
    transactionHash: '0xtx',
    blockNumber: 100n,
    logIndex: 0,
    ...overrides,
  };
}

describe('TicketSaleDeployedHandler', () => {
  it('sets ticketSaleAddress on the matching event_contracts row', async () => {
    const eventContracts = new InMemoryEventContractsRepository();
    eventContracts.seed({
      eventTicketsAddress: '0xtickets',
      brandAddress: '0xbrand',
    });
    const handler = new TicketSaleDeployedHandler(
      eventContracts,
      new FakeTransactionRunner(),
    );

    await handler.handle(log());

    expect(
      (await eventContracts.findByEventTicketsAddress('0xtickets'))
        ?.ticketSaleAddress,
    ).toBe('0xticketsale');
  });

  it('skips silently when the event module is unknown', async () => {
    const eventContracts = new InMemoryEventContractsRepository();
    const handler = new TicketSaleDeployedHandler(
      eventContracts,
      new FakeTransactionRunner(),
    );

    await handler.handle(log());

    expect(
      await eventContracts.findByEventTicketsAddress('0xtickets'),
    ).toBeNull();
  });
});
