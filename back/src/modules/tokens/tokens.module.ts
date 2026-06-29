import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandTokenOrmEntity } from './infrastructure/brand-token.orm-entity';
import { TokenHolderOrmEntity } from './infrastructure/token-holder.orm-entity';
import { TokenTransactionOrmEntity } from './infrastructure/token-transaction.orm-entity';
// Ports
import { TokenRepository } from './domain/token.repository';
import { TokenHolderRepository } from './domain/token-holder.repository';
import { TokenTransactionRepository } from './domain/token-transaction.repository';
import { BrandLookup } from './domain/brand-lookup';
import { BlockchainGateway } from './domain/blockchain-gateway';
// Adapters
import { TypeOrmTokenRepository } from './infrastructure/typeorm-token.repository';
import { TypeOrmTokenHolderRepository } from './infrastructure/typeorm-token-holder.repository';
import { TypeOrmTokenTransactionRepository } from './infrastructure/typeorm-token-transaction.repository';
import { TypeOrmBrandLookup } from './infrastructure/typeorm-brand-lookup';
import { NoopBlockchainGateway } from './infrastructure/noop-blockchain-gateway';
// Use-cases
import { CreateTokenUseCase } from './application/use-cases/create-token.use-case';
import { GetTokenUseCase } from './application/use-cases/get-token.use-case';
import { GetTokenByBrandUseCase } from './application/use-cases/get-token-by-brand.use-case';
import { UpdateTokenPriceUseCase } from './application/use-cases/update-token-price.use-case';
import { ListTokenHoldersUseCase } from './application/use-cases/list-token-holders.use-case';
import { GetMyBalanceUseCase } from './application/use-cases/get-my-balance.use-case';
import { TransferTokensUseCase } from './application/use-cases/transfer-tokens.use-case';
import { PurchaseTokensUseCase } from './application/use-cases/purchase-tokens.use-case';
import { ListTokenTransactionsUseCase } from './application/use-cases/list-token-transactions.use-case';
import { ListMyTransactionsUseCase } from './application/use-cases/list-my-transactions.use-case';
import { GetMyPortfolioUseCase } from './application/use-cases/get-my-portfolio.use-case';
import { TokensController } from './presentation/tokens.controller';

/**
 * Module tokens (off-chain). L'accès chaîne est isolé derrière `BlockchainGateway`
 * (adapter no-op pour l'instant). `BrandLookup` lit la table `brand` en SQL pour
 * garder le module `brands` découplé.
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
    { provide: BrandLookup, useClass: TypeOrmBrandLookup },
    { provide: BlockchainGateway, useClass: NoopBlockchainGateway },
    CreateTokenUseCase,
    GetTokenUseCase,
    GetTokenByBrandUseCase,
    UpdateTokenPriceUseCase,
    ListTokenHoldersUseCase,
    GetMyBalanceUseCase,
    TransferTokensUseCase,
    PurchaseTokensUseCase,
    ListTokenTransactionsUseCase,
    ListMyTransactionsUseCase,
    GetMyPortfolioUseCase,
  ],
})
export class TokensModule {}
