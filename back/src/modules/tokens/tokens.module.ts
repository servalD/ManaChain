import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandTokenOrmEntity } from './infrastructure/brand-token.orm-entity';
import { TokenHolderOrmEntity } from './infrastructure/token-holder.orm-entity';
import { TokenTransactionOrmEntity } from './infrastructure/token-transaction.orm-entity';
// Ports
import { TokenRepository } from './domain/token.repository';
import { TokenHolderRepository } from './domain/token-holder.repository';
import { TokenTransactionRepository } from './domain/token-transaction.repository';
// Adapters
import { TypeOrmTokenRepository } from './infrastructure/typeorm-token.repository';
import { TypeOrmTokenHolderRepository } from './infrastructure/typeorm-token-holder.repository';
import { TypeOrmTokenTransactionRepository } from './infrastructure/typeorm-token-transaction.repository';
// Use-cases (lecture seule — la chaîne est la source de vérité, voir chain-sync)
import { GetTokenUseCase } from './application/use-cases/get-token.use-case';
import { GetTokenByBrandUseCase } from './application/use-cases/get-token-by-brand.use-case';
import { ListTokenHoldersUseCase } from './application/use-cases/list-token-holders.use-case';
import { GetMyBalanceUseCase } from './application/use-cases/get-my-balance.use-case';
import { ListTokenTransactionsUseCase } from './application/use-cases/list-token-transactions.use-case';
import { ListMyTransactionsUseCase } from './application/use-cases/list-my-transactions.use-case';
import { GetMyPortfolioUseCase } from './application/use-cases/get-my-portfolio.use-case';
import { GetTokenChainInfoUseCase } from '../chain-sync/application/get-token-chain-info.use-case';
import { TokensController } from './presentation/tokens.controller';

/**
 * Module tokens — lecture seule. Les écritures (création, achat, transfert,
 * prix) sont pilotées par les events on-chain (module `chain-sync`).
 * `GetTokenChainInfoUseCase` ne nécessite pas d'importer `ChainSyncModule` :
 * ses ports (`BrandContractsRepository`/`TokenSaleRepository`) sont exposés
 * globalement par `ChainRegistryModule` (évite un cycle avec chain-sync, qui
 * importe déjà `tokens` pour ses handlers).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      BrandTokenOrmEntity,
      TokenHolderOrmEntity,
      TokenTransactionOrmEntity,
    ]),
  ],
  controllers: [TokensController],
  providers: [
    { provide: TokenRepository, useClass: TypeOrmTokenRepository },
    { provide: TokenHolderRepository, useClass: TypeOrmTokenHolderRepository },
    {
      provide: TokenTransactionRepository,
      useClass: TypeOrmTokenTransactionRepository,
    },
    GetTokenUseCase,
    GetTokenByBrandUseCase,
    ListTokenHoldersUseCase,
    GetMyBalanceUseCase,
    ListTokenTransactionsUseCase,
    ListMyTransactionsUseCase,
    GetMyPortfolioUseCase,
    GetTokenChainInfoUseCase,
  ],
  // Consommés par chain-sync (écritures pilotées par les events on-chain).
  exports: [TokenRepository, TokenHolderRepository, TokenTransactionRepository],
})
export class TokensModule {}
