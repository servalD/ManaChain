import { ChainEventHandler } from '../../domain/chain-event-handler';
import { DecodedLog } from '../../domain/chain-reader';
import { TokenSaleRepository } from '../../domain/token-sale.repository';
import { TokenSaleStatus } from '../../domain/token-sale';
import { TransactionRunner } from '../../../../shared/application/transaction-runner';

/**
 * Events sans argument (`SaleClosed`, `SaleCancelledByAdmin`,
 * `SaleCancelledByBrand`) de TokenSaleEscrow : `log.address` EST l'escrow.
 * Une instance par event name, voir `chain-sync.module.ts`.
 */
export class SaleStatusHandler implements ChainEventHandler {
  constructor(
    readonly eventName: string,
    private readonly targetStatus: TokenSaleStatus,
    private readonly tokenSales: TokenSaleRepository,
    private readonly tx: TransactionRunner,
  ) {}

  async handle(log: DecodedLog): Promise<void> {
    const escrowAddress = log.address.toLowerCase();
    await this.tx.run(() =>
      this.tokenSales.setStatus(escrowAddress, this.targetStatus),
    );
  }
}
