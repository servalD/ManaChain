import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChainSyncCursorOrmEntity } from './chain-sync-cursor.orm-entity';
import { BrandContractsOrmEntity } from './brand-contracts.orm-entity';
import { TokenSaleOrmEntity } from './token-sale.orm-entity';
import { ViemChainReader } from './viem-chain-reader';
import { TypeOrmSyncCursorRepository } from './typeorm-sync-cursor.repository';
import { TypeOrmBrandContractsRepository } from './typeorm-brand-contracts.repository';
import { TypeOrmTokenSaleRepository } from './typeorm-token-sale.repository';
import { ChainReader } from '../domain/chain-reader';
import { SyncCursorRepository } from '../domain/sync-cursor.repository';
import { BrandContractsRepository } from '../domain/brand-contracts.repository';
import { TokenSaleRepository } from '../domain/token-sale.repository';

/**
 * Ports/adapters purs de chain-sync (lecture chaîne + tables `brand_contracts`/
 * `token_sale`/`chain_sync_cursor`), exposés globalement — comme
 * `TransactionRunner`/`DatabaseContext` dans `DatabaseModule`. Casse le cycle
 * `tokens`/`users` ↔ `chain-sync` : ces modules consomment les ports sans
 * importer `ChainSyncModule` (qui, lui, dépend d'eux pour ses handlers).
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChainSyncCursorOrmEntity,
      BrandContractsOrmEntity,
      TokenSaleOrmEntity,
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
  ],
  exports: [
    ChainReader,
    SyncCursorRepository,
    BrandContractsRepository,
    TokenSaleRepository,
  ],
})
export class ChainRegistryModule {}
