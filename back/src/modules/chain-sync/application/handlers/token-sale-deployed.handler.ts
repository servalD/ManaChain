import { Injectable, Logger } from '@nestjs/common';
import { ChainEventHandler } from '../../domain/chain-event-handler';
import { DecodedLog } from '../../domain/chain-reader';
import { BrandContractsRepository } from '../../domain/brand-contracts.repository';
import { TokenSaleRepository } from '../../domain/token-sale.repository';
import { TokenRepository } from '../../../tokens/domain/token.repository';
import { TransactionRunner } from '../../../../shared/application/transaction-runner';

/**
 * `TokenSaleDeployed` (SaleFactory) : enregistre `token_sale`. Suppose que
 * `brand_token` existe déjà (créé par {@link BrandModuleDeployedHandler}, traité
 * avant dans la même passe statique) — sinon l'event est ignoré (log) : cas
 * limite non couvert (marque dont le wallet applicatif n'était pas encore lié
 * au moment du déploiement de la vente).
 */
@Injectable()
export class TokenSaleDeployedHandler implements ChainEventHandler {
  readonly eventName = 'TokenSaleDeployed';
  private readonly logger = new Logger(TokenSaleDeployedHandler.name);

  constructor(
    private readonly brandContracts: BrandContractsRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly tokenSales: TokenSaleRepository,
    private readonly tx: TransactionRunner,
  ) {}

  async handle(log: DecodedLog): Promise<void> {
    const escrowAddress = (log.args.escrow as string).toLowerCase();
    if (await this.tokenSales.findByEscrowAddress(escrowAddress)) return;

    const brandAddress = (log.args.brand as string).toLowerCase();
    const brandContracts =
      await this.brandContracts.findByBrandAddress(brandAddress);
    const token =
      brandContracts?.brandId != null
        ? await this.tokenRepository.findByBrandId(brandContracts.brandId)
        : null;

    if (!token) {
      this.logger.warn(
        `TokenSaleDeployed for unresolved brand_token (brand=${brandAddress}, escrow=${escrowAddress}) — skipped`,
      );
      return;
    }

    const pricePerToken = (log.args.pricePerToken as bigint).toString();
    const totalForSale = (log.args.totalForSale as bigint).toString();
    const startTime = new Date(Number(log.args.startTime) * 1000);
    const endTime = new Date(Number(log.args.endTime) * 1000);

    await this.tx.run(() =>
      this.tokenSales.create({
        tokenId: token.id,
        escrowAddress,
        pricePerToken,
        totalForSale,
        startTime,
        endTime,
        deployTxHash: log.transactionHash,
      }),
    );
  }
}
