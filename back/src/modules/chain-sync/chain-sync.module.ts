import { Module, Provider } from '@nestjs/common';
import { makeGaugeProvider } from '@willsoto/nestjs-prometheus';
import { UsersModule } from '../users/users.module';
import { BrandsModule } from '../brands/brands.module';
import { TokensModule } from '../tokens/tokens.module';
import { ChainRegistryModule } from './infrastructure/chain-registry.module';
import { TokenSaleRepository } from './domain/token-sale.repository';
import { BrandContractsRepository } from './domain/brand-contracts.repository';
import { ChainEventHandler } from './domain/chain-event-handler';
import { CHAIN_EVENT_HANDLERS } from './application/chain-event-handlers.token';
import { BrandModuleDeployedHandler } from './application/handlers/brand-module-deployed.handler';
import { TokenSaleDeployedHandler } from './application/handlers/token-sale-deployed.handler';
import { BoughtHandler } from './application/handlers/bought.handler';
import { RefundClaimedHandler } from './application/handlers/refund-claimed.handler';
import { Erc20TransferHandler } from './application/handlers/erc20-transfer.handler';
import { SaleStatusHandler } from './application/handlers/sale-status.handler';
import { BrandFlagHandler } from './application/handlers/brand-flag.handler';
import { ChainSyncService } from './application/chain-sync.service';
import { ReconcileUserChainDataUseCase } from './application/reconcile-user-chain-data.use-case';
import { UnlinkUserChainDataUseCase } from './application/unlink-user-chain-data.use-case';
import { UserBlockchainAddressLinkedListener } from './application/user-blockchain-address-linked.listener';
import { ChainSyncController } from './presentation/chain-sync.controller';
import { TransactionRunner } from '../../shared/application/transaction-runner';

const SALE_CLOSED = 'SaleClosedHandler';
const SALE_CANCELLED_BY_ADMIN = 'SaleCancelledByAdminHandler';
const SALE_CANCELLED_BY_BRAND = 'SaleCancelledByBrandHandler';
const BRAND_WHITELISTED = 'BrandWhitelistedHandler';
const BRAND_BLACKLISTED = 'BrandBlacklistedHandler';

const saleStatusHandlerProviders: Provider[] = [
  {
    provide: SALE_CLOSED,
    useFactory: (tokenSales: TokenSaleRepository, tx: TransactionRunner) =>
      new SaleStatusHandler('SaleClosed', 'closed', tokenSales, tx),
    inject: [TokenSaleRepository, TransactionRunner],
  },
  {
    provide: SALE_CANCELLED_BY_ADMIN,
    useFactory: (tokenSales: TokenSaleRepository, tx: TransactionRunner) =>
      new SaleStatusHandler(
        'SaleCancelledByAdmin',
        'cancelled_by_admin',
        tokenSales,
        tx,
      ),
    inject: [TokenSaleRepository, TransactionRunner],
  },
  {
    provide: SALE_CANCELLED_BY_BRAND,
    useFactory: (tokenSales: TokenSaleRepository, tx: TransactionRunner) =>
      new SaleStatusHandler(
        'SaleCancelledByBrand',
        'cancelled_by_brand',
        tokenSales,
        tx,
      ),
    inject: [TokenSaleRepository, TransactionRunner],
  },
];

const brandFlagHandlerProviders: Provider[] = [
  {
    provide: BRAND_WHITELISTED,
    useFactory: (
      brandContracts: BrandContractsRepository,
      tx: TransactionRunner,
    ) =>
      new BrandFlagHandler(
        'BrandWhitelisted',
        'allowed',
        'setWhitelisted',
        brandContracts,
        tx,
      ),
    inject: [BrandContractsRepository, TransactionRunner],
  },
  {
    provide: BRAND_BLACKLISTED,
    useFactory: (
      brandContracts: BrandContractsRepository,
      tx: TransactionRunner,
    ) =>
      new BrandFlagHandler(
        'BrandBlacklisted',
        'banned',
        'setBlacklisted',
        brandContracts,
        tx,
      ),
    inject: [BrandContractsRepository, TransactionRunner],
  },
];

const chainEventHandlersProvider: Provider = {
  provide: CHAIN_EVENT_HANDLERS,
  useFactory: (
    brandModuleDeployed: BrandModuleDeployedHandler,
    tokenSaleDeployed: TokenSaleDeployedHandler,
    bought: BoughtHandler,
    refundClaimed: RefundClaimedHandler,
    erc20Transfer: Erc20TransferHandler,
    saleClosed: SaleStatusHandler,
    saleCancelledByAdmin: SaleStatusHandler,
    saleCancelledByBrand: SaleStatusHandler,
    brandWhitelisted: BrandFlagHandler,
    brandBlacklisted: BrandFlagHandler,
  ): ChainEventHandler[] => [
    brandModuleDeployed,
    tokenSaleDeployed,
    bought,
    refundClaimed,
    erc20Transfer,
    saleClosed,
    saleCancelledByAdmin,
    saleCancelledByBrand,
    brandWhitelisted,
    brandBlacklisted,
  ],
  inject: [
    BrandModuleDeployedHandler,
    TokenSaleDeployedHandler,
    BoughtHandler,
    RefundClaimedHandler,
    Erc20TransferHandler,
    SALE_CLOSED,
    SALE_CANCELLED_BY_ADMIN,
    SALE_CANCELLED_BY_BRAND,
    BRAND_WHITELISTED,
    BRAND_BLACKLISTED,
  ],
};

/**
 * Miroir SQL de la chaîne (voir `temp-plan/phase-2-back-chain-sync.md`). Lit
 * Fuji en lecture seule via `ChainReader` (viem) ; n'écrit jamais on-chain.
 *
 * Dépend de `UsersModule`/`BrandsModule`/`TokensModule` (un seul sens : ces
 * modules n'importent pas `ChainSyncModule` en retour) — les ports purs de
 * chain-sync dont ils ont besoin (`BrandContractsRepository`/`TokenSaleRepository`
 * /`ChainReader`) viennent de `ChainRegistryModule` (`@Global()`), et le
 * rattrapage déclenché par `PUT /users/me/blockchain-address` passe par un
 * event (`UserBlockchainAddressLinkedListener`), pas par une injection directe.
 */
@Module({
  imports: [ChainRegistryModule, UsersModule, BrandsModule, TokensModule],
  controllers: [ChainSyncController],
  providers: [
    BrandModuleDeployedHandler,
    TokenSaleDeployedHandler,
    BoughtHandler,
    RefundClaimedHandler,
    Erc20TransferHandler,
    ...saleStatusHandlerProviders,
    ...brandFlagHandlerProviders,
    chainEventHandlersProvider,
    makeGaugeProvider({
      name: 'chain_sync_lag_blocks',
      help: 'Blocks between the safe chain tip and the last block processed by chain-sync',
    }),
    ChainSyncService,
    ReconcileUserChainDataUseCase,
    UnlinkUserChainDataUseCase,
    UserBlockchainAddressLinkedListener,
  ],
  exports: [UnlinkUserChainDataUseCase],
})
export class ChainSyncModule {}
