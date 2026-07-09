import { EventModuleDeployedHandler } from './event-module-deployed.handler';
import {
  FakeTransactionRunner,
  InMemoryEventContractsRepository,
} from '../test-fakes';
import type { DecodedLog } from '../../domain/chain-reader';

function log(overrides: Partial<DecodedLog> = {}): DecodedLog {
  return {
    eventName: 'EventModuleDeployed',
    address: '0xeventfactory',
    args: { brand: '0xBRAND', eventTickets: '0xTICKETS' },
    transactionHash: '0xtx1',
    blockNumber: 100n,
    logIndex: 0,
    ...overrides,
  };
}

describe('EventModuleDeployedHandler', () => {
  it('creates event_contracts from the event args', async () => {
    const eventContracts = new InMemoryEventContractsRepository();
    const handler = new EventModuleDeployedHandler(
      eventContracts,
      new FakeTransactionRunner(),
    );

    await handler.handle(log());

    const row = await eventContracts.findByEventTicketsAddress('0xtickets');
    expect(row?.brandAddress).toBe('0xbrand');
    expect(row?.ticketSaleAddress).toBeNull();
  });

  it('is idempotent — replaying the same event is a no-op', async () => {
    const eventContracts = new InMemoryEventContractsRepository();
    const handler = new EventModuleDeployedHandler(
      eventContracts,
      new FakeTransactionRunner(),
    );

    await handler.handle(log());
    await handler.handle(log());

    expect(await eventContracts.listEventTicketsAddresses()).toHaveLength(1);
  });
});
