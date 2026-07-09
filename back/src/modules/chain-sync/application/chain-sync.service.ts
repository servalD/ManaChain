import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Gauge } from 'prom-client';
import { Env } from '../../../infrastructure/config/env.validation';
import { ChainReader, DecodedLog } from '../domain/chain-reader';
import { SyncCursorRepository } from '../domain/sync-cursor.repository';
import { ChainEventHandler } from '../domain/chain-event-handler';
import { TransactionRunner } from '../../../shared/application/transaction-runner';
import { BrandContractsRepository } from '../domain/brand-contracts.repository';
import { TokenSaleRepository } from '../domain/token-sale.repository';
import { EventContractsRepository } from '../domain/event-contracts.repository';
import {
  CHAIN_EVENT_HANDLERS,
  TICKET_EVENT_HANDLERS,
} from './chain-event-handlers.token';
import {
  brandFactoryAbi,
  erc20Abi,
  eventFactoryAbi,
  eventTicketsAbi,
  manaAdminAbi,
  saleFactoryAbi,
  ticketSaleAbi,
  tokenSaleEscrowAbi,
} from '../infrastructure/abis';

const CURSOR_ID = 'main';
const CHUNK_SIZE = 2000n;

/**
 * Boucle de synchronisation : `@Interval` anti-réentrant, 3 passes par chunk
 * (statique = découverte d'adresses ; dynamique token ; dynamique ticket —
 * groupe séparé car `TicketSale.Bought` et `TokenSaleEscrow.Bought` partagent
 * le même nom d'event et ne peuvent pas cohabiter dans une seule map de
 * dispatch), transaction DB par chunk, curseur avancé en fin de chunk
 * (rejouer un range déjà traité est sans effet — chaque handler est
 * idempotent, voir leurs docs respectives).
 */
@Injectable()
export class ChainSyncService implements OnModuleInit {
  private readonly logger = new Logger(ChainSyncService.name);
  private isRunning = false;
  private readonly handlersByEvent: Map<string, ChainEventHandler>;
  private readonly ticketHandlersByEvent: Map<string, ChainEventHandler>;
  private readonly staticAddresses: {
    manaAdmin: string;
    brandFactory: string;
    saleFactory: string;
    eventFactory: string;
  };
  private readonly confirmations: bigint;
  private readonly startBlock: bigint;
  private readonly enabled: boolean;
  private readonly pollIntervalMs: number;

  constructor(
    config: ConfigService<Env, true>,
    private readonly scheduler: SchedulerRegistry,
    private readonly chainReader: ChainReader,
    private readonly cursor: SyncCursorRepository,
    private readonly tx: TransactionRunner,
    private readonly brandContracts: BrandContractsRepository,
    private readonly tokenSales: TokenSaleRepository,
    private readonly eventContracts: EventContractsRepository,
    @Inject(CHAIN_EVENT_HANDLERS) handlers: ChainEventHandler[],
    @Inject(TICKET_EVENT_HANDLERS) ticketHandlers: ChainEventHandler[],
    @InjectMetric('chain_sync_lag_blocks')
    private readonly lagGauge: Gauge<string>,
  ) {
    this.handlersByEvent = new Map(handlers.map((h) => [h.eventName, h]));
    this.ticketHandlersByEvent = new Map(
      ticketHandlers.map((h) => [h.eventName, h]),
    );
    this.enabled = config.get('CHAIN_SYNC_ENABLED', { infer: true });
    this.pollIntervalMs = config.get('CHAIN_SYNC_POLL_INTERVAL_MS', {
      infer: true,
    });
    this.confirmations = BigInt(
      config.get('CHAIN_SYNC_CONFIRMATIONS', { infer: true }),
    );
    this.startBlock = BigInt(
      config.get('CHAIN_SYNC_START_BLOCK', { infer: true }),
    );
    this.staticAddresses = {
      manaAdmin: (
        config.get('MANA_ADMIN_ADDRESS', { infer: true }) ?? ''
      ).toLowerCase(),
      brandFactory: (
        config.get('BRAND_FACTORY_ADDRESS', { infer: true }) ?? ''
      ).toLowerCase(),
      saleFactory: (
        config.get('SALE_FACTORY_ADDRESS', { infer: true }) ?? ''
      ).toLowerCase(),
      eventFactory: (
        config.get('EVENT_FACTORY_ADDRESS', { infer: true }) ?? ''
      ).toLowerCase(),
    };
  }

  onModuleInit(): void {
    if (!this.enabled) {
      this.logger.log('disabled (CHAIN_SYNC_ENABLED=false)');
      return;
    }
    const interval = setInterval(() => void this.tick(), this.pollIntervalMs);
    this.scheduler.addInterval('chain-sync-tick', interval);
    this.logger.log(`polling every ${this.pollIntervalMs}ms`);
  }

  async tick(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      const latest = await this.chainReader.getBlockNumber();
      const safeLatest =
        latest > this.confirmations ? latest - this.confirmations : 0n;
      const processed = await this.cursor.getLastProcessedBlock(CURSOR_ID);
      let from = processed > 0n ? processed + 1n : this.startBlock;

      this.lagGauge.set(Number(safeLatest > from ? safeLatest - from : 0n));

      while (from <= safeLatest) {
        const to =
          from + CHUNK_SIZE - 1n > safeLatest
            ? safeLatest
            : from + CHUNK_SIZE - 1n;
        await this.processChunk(from, to);
        from = to + 1n;
      }
    } catch (error) {
      this.logger.error(
        `tick failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
    } finally {
      this.isRunning = false;
    }
  }

  private async processChunk(from: bigint, to: bigint): Promise<void> {
    await this.tx.run(async () => {
      await this.dispatch(
        await this.getStaticLogs(from, to),
        this.handlersByEvent,
      );
      await this.dispatch(
        await this.getDynamicLogs(from, to),
        this.handlersByEvent,
      );
      await this.dispatch(
        await this.getTicketDynamicLogs(from, to),
        this.ticketHandlersByEvent,
      );
      await this.cursor.setLastProcessedBlock(CURSOR_ID, to);
    });
  }

  private async dispatch(
    logs: DecodedLog[],
    handlersByEvent: Map<string, ChainEventHandler>,
  ): Promise<void> {
    const sorted = [...logs].sort((a, b) =>
      a.blockNumber === b.blockNumber
        ? a.logIndex - b.logIndex
        : Number(a.blockNumber - b.blockNumber),
    );
    for (const log of sorted) {
      const handler = handlersByEvent.get(log.eventName);
      if (handler) await handler.handle(log);
    }
  }

  private async getStaticLogs(from: bigint, to: bigint): Promise<DecodedLog[]> {
    const queries: Promise<DecodedLog[]>[] = [];
    if (this.staticAddresses.manaAdmin) {
      queries.push(
        this.chainReader.getLogs({
          address: this.staticAddresses.manaAdmin,
          abi: manaAdminAbi,
          fromBlock: from,
          toBlock: to,
        }),
      );
    }
    if (this.staticAddresses.brandFactory) {
      queries.push(
        this.chainReader.getLogs({
          address: this.staticAddresses.brandFactory,
          abi: brandFactoryAbi,
          fromBlock: from,
          toBlock: to,
        }),
      );
    }
    if (this.staticAddresses.saleFactory) {
      queries.push(
        this.chainReader.getLogs({
          address: this.staticAddresses.saleFactory,
          abi: saleFactoryAbi,
          fromBlock: from,
          toBlock: to,
        }),
      );
    }
    if (this.staticAddresses.eventFactory) {
      queries.push(
        this.chainReader.getLogs({
          address: this.staticAddresses.eventFactory,
          abi: eventFactoryAbi,
          fromBlock: from,
          toBlock: to,
        }),
      );
    }
    return (await Promise.all(queries)).flat();
  }

  private async getDynamicLogs(
    from: bigint,
    to: bigint,
  ): Promise<DecodedLog[]> {
    const [escrowAddresses, supportTokenAddresses] = await Promise.all([
      this.tokenSales.listAllEscrowAddresses(),
      this.brandContracts.listSupportTokenAddresses(),
    ]);
    const queries: Promise<DecodedLog[]>[] = [];
    if (escrowAddresses.length) {
      queries.push(
        this.chainReader.getLogs({
          address: escrowAddresses,
          abi: tokenSaleEscrowAbi,
          fromBlock: from,
          toBlock: to,
        }),
      );
    }
    if (supportTokenAddresses.length) {
      queries.push(
        this.chainReader.getLogs({
          address: supportTokenAddresses,
          abi: erc20Abi,
          fromBlock: from,
          toBlock: to,
        }),
      );
    }
    return (await Promise.all(queries)).flat();
  }

  private async getTicketDynamicLogs(
    from: bigint,
    to: bigint,
  ): Promise<DecodedLog[]> {
    const [ticketSaleAddresses, eventTicketsAddresses] = await Promise.all([
      this.eventContracts.listTicketSaleAddresses(),
      this.eventContracts.listEventTicketsAddresses(),
    ]);
    const queries: Promise<DecodedLog[]>[] = [];
    if (ticketSaleAddresses.length) {
      queries.push(
        this.chainReader.getLogs({
          address: ticketSaleAddresses,
          abi: ticketSaleAbi,
          fromBlock: from,
          toBlock: to,
        }),
      );
    }
    if (eventTicketsAddresses.length) {
      queries.push(
        this.chainReader.getLogs({
          address: eventTicketsAddresses,
          abi: eventTicketsAbi,
          fromBlock: from,
          toBlock: to,
        }),
      );
    }
    return (await Promise.all(queries)).flat();
  }

  async getStatus(): Promise<{
    lastProcessedBlock: string;
    lagBlocks: number;
  }> {
    const [latest, processed] = await Promise.all([
      this.chainReader.getBlockNumber(),
      this.cursor.getLastProcessedBlock(CURSOR_ID),
    ]);
    const safeLatest =
      latest > this.confirmations ? latest - this.confirmations : 0n;
    return {
      lastProcessedBlock: processed.toString(),
      lagBlocks: Number(safeLatest > processed ? safeLatest - processed : 0n),
    };
  }
}
