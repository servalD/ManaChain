import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChainSyncCursorOrmEntity } from './chain-sync-cursor.orm-entity';
import { BrandContractsOrmEntity } from './brand-contracts.orm-entity';
import { TokenSaleOrmEntity } from './token-sale.orm-entity';
import { EventContractsOrmEntity } from './event-contracts.orm-entity';
import { EventTicketTypeOrmEntity } from './event-ticket-type.orm-entity';
import { EventTicketPurchaseOrmEntity } from './event-ticket-purchase.orm-entity';
import { ViemChainReader } from './viem-chain-reader';
import { TypeOrmSyncCursorRepository } from './typeorm-sync-cursor.repository';
import { TypeOrmBrandContractsRepository } from './typeorm-brand-contracts.repository';
import { TypeOrmTokenSaleRepository } from './typeorm-token-sale.repository';
import { TypeOrmEventContractsRepository } from './typeorm-event-contracts.repository';
import { TypeOrmEventTicketTypeRepository } from './typeorm-event-ticket-type.repository';
import { TypeOrmEventTicketPurchaseRepository } from './typeorm-event-ticket-purchase.repository';
import { ChainReader } from '../domain/chain-reader';
import { SyncCursorRepository } from '../domain/sync-cursor.repository';
import { BrandContractsRepository } from '../domain/brand-contracts.repository';
import { TokenSaleRepository } from '../domain/token-sale.repository';
import { EventContractsRepository } from '../domain/event-contracts.repository';
import { EventTicketTypeRepository } from '../domain/event-ticket-type.repository';
import { EventTicketPurchaseRepository } from '../domain/event-ticket-purchase.repository';

/**
 * Ports/adapters purs de chain-sync (lecture chaîne + tables `brand_contracts`/
 * `token_sale`/`event_contracts`/`event_ticket_type`/`event_ticket_purchase`/
 * `chain_sync_cursor`), exposés globalement — comme `TransactionRunner`/
 * `DatabaseContext` dans `DatabaseModule`. Casse le cycle `tokens`/`users`/
 * `events` ↔ `chain-sync` : ces modules consomment les ports sans importer
 * `ChainSyncModule` (qui, lui, dépend d'eux pour ses handlers).
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChainSyncCursorOrmEntity,
      BrandContractsOrmEntity,
      TokenSaleOrmEntity,
      EventContractsOrmEntity,
      EventTicketTypeOrmEntity,
      EventTicketPurchaseOrmEntity,
    ]),
  ],
  providers: [
    { provide: ChainReader, useClass: ViemChainReader },
    { provide: SyncCursorRepository, useClass: TypeOrmSyncCursorRepository },
    {
      provide: BrandContractsRepository,
      useClass: TypeOrmBrandContractsRepository,
    },
    { provide: TokenSaleRepository, useClass: TypeOrmTokenSaleRepository },
    {
      provide: EventContractsRepository,
      useClass: TypeOrmEventContractsRepository,
    },
    {
      provide: EventTicketTypeRepository,
      useClass: TypeOrmEventTicketTypeRepository,
    },
    {
      provide: EventTicketPurchaseRepository,
      useClass: TypeOrmEventTicketPurchaseRepository,
    },
  ],
  exports: [
    ChainReader,
    SyncCursorRepository,
    BrandContractsRepository,
    TokenSaleRepository,
    EventContractsRepository,
    EventTicketTypeRepository,
    EventTicketPurchaseRepository,
  ],
})
export class ChainRegistryModule {}
