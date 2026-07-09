import { ChainSyncService } from './chain-sync.service';
import {
  FakeChainReader,
  FakeTransactionRunner,
  InMemoryBrandContractsRepository,
  InMemorySyncCursorRepository,
  InMemoryTokenSaleRepository,
} from './test-fakes';
import type { ChainEventHandler } from '../domain/chain-event-handler';
import type { DecodedLog } from '../domain/chain-reader';
import type { Env } from '../../../infrastructure/config/env.validation';
import type { ConfigService } from '@nestjs/config';
import type { SchedulerRegistry } from '@nestjs/schedule';
import type { Gauge } from 'prom-client';

function fakeConfig(
  overrides: Partial<Record<string, unknown>> = {},
): ConfigService<Env, true> {
  const values: Record<string, unknown> = {
    CHAIN_SYNC_ENABLED: false,
    CHAIN_SYNC_POLL_INTERVAL_MS: 5000,
    CHAIN_SYNC_CONFIRMATIONS: 2,
    CHAIN_SYNC_START_BLOCK: 0,
    MANA_ADMIN_ADDRESS: '0xmanaadmin',
    BRAND_FACTORY_ADDRESS: '0xbrandfactory',
    SALE_FACTORY_ADDRESS: '0xsalefactory',
    ...overrides,
  };
  return { get: (key: string) => values[key] } as unknown as ConfigService<
    Env,
    true
  >;
}

class RecordingHandler implements ChainEventHandler {
  readonly received: DecodedLog[] = [];
  constructor(readonly eventName: string) {}
  handle(log: DecodedLog): Promise<void> {
    this.received.push(log);
    return Promise.resolve();
  }
}

function setup(handlers: ChainEventHandler[] = []) {
  const chainReader = new FakeChainReader();
  const cursor = new InMemorySyncCursorRepository();
  const brandContracts = new InMemoryBrandContractsRepository();
  const tokenSales = new InMemoryTokenSaleRepository();
  const lagGauge = { set: jest.fn() } as unknown as Gauge<string>;
  const scheduler = {} as SchedulerRegistry;

  const service = new ChainSyncService(
    fakeConfig(),
    scheduler,
    chainReader,
    cursor,
    new FakeTransactionRunner(),
    brandContracts,
    tokenSales,
    handlers,
    lagGauge,
  );
  return { service, chainReader, cursor, brandContracts, tokenSales, lagGauge };
}

describe('ChainSyncService', () => {
  it('getStatus reports lag against the safe chain tip (latest - confirmations)', async () => {
    const { service, chainReader, cursor } = setup();
    chainReader.blockNumber = 110n;
    await cursor.setLastProcessedBlock('main', 100n);

    const status = await service.getStatus();

    expect(status.lastProcessedBlock).toBe('100');
    expect(status.lagBlocks).toBe(8); // safeLatest = 110 - 2 = 108, 108 - 100 = 8
  });

  it('tick advances the cursor to the safe chain tip even with no matching logs', async () => {
    const { service, chainReader, cursor } = setup();
    chainReader.blockNumber = 50n;

    await service.tick();

    expect(await cursor.getLastProcessedBlock('main')).toBe(48n); // 50 - confirmations(2)
  });

  it('tick dispatches decoded logs to the handler matching their eventName', async () => {
    const brandModuleDeployed = new RecordingHandler('BrandModuleDeployed');
    const otherEvent = new RecordingHandler('SomethingElse');
    const { service, chainReader } = setup([brandModuleDeployed, otherEvent]);
    chainReader.blockNumber = 10n;
    chainReader.logs = [
      {
        eventName: 'BrandModuleDeployed',
        address: '0xbrandfactory',
        args: { brand: '0xbrand' },
        transactionHash: '0xtx',
        blockNumber: 5n,
        logIndex: 0,
      },
    ];

    await service.tick();

    expect(brandModuleDeployed.received).toHaveLength(1);
    expect(otherEvent.received).toHaveLength(0);
  });

  it('tick is idempotent — replaying an already-processed range moves nothing new', async () => {
    const handler = new RecordingHandler('BrandModuleDeployed');
    const { service, chainReader, cursor } = setup([handler]);
    chainReader.blockNumber = 10n;
    chainReader.logs = [
      {
        eventName: 'BrandModuleDeployed',
        address: '0xbrandfactory',
        args: { brand: '0xbrand' },
        transactionHash: '0xtx',
        blockNumber: 5n,
        logIndex: 0,
      },
    ];

    await service.tick();
    expect(handler.received).toHaveLength(1);

    // Un second tick sans nouveaux blocs ne doit rien redispatcher (curseur déjà à jour).
    await service.tick();
    expect(handler.received).toHaveLength(1);
    expect(await cursor.getLastProcessedBlock('main')).toBe(8n);
  });
});
