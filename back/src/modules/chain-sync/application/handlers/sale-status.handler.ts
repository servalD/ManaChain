import { ChainEventHandler } from '../../domain/chain-event-handler';
import { DecodedLog } from '../../domain/chain-reader';
import { TokenSaleRepository } from '../../domain/token-sale.repository';
import { TokenSaleStatus } from '../../domain/token-sale';
import { TokenHolderRepository } from '../../../tokens/domain/token-holder.repository';
import { NotificationRepository } from '../../../notifications/domain/notification.repository';
import { TransactionRunner } from '../../../../shared/application/transaction-runner';

const HOLDERS_PAGE_SIZE = 200;

/**
 * Events sans argument (`SaleClosed`, `SaleCancelledByAdmin`,
 * `SaleCancelledByBrand`) de TokenSaleEscrow : `log.address` EST l'escrow.
 * Une instance par event name, voir `chain-sync.module.ts`.
 *
 * Pour `cancelled_by_brand` uniquement (annulation à l'initiative de la
 * marque elle-même — distincte de `cancelled_by_admin`, déjà notifiée via
 * `BanBrandUseCase`), notifie chaque détenteur du token pour qu'il sache
 * réclamer son remboursement (`claimRefund`). Best-effort, jamais bloquant —
 * même try/catch que {@link BrandFlagHandler}.
 */
export class SaleStatusHandler implements ChainEventHandler {
  constructor(
    readonly eventName: string,
    private readonly targetStatus: TokenSaleStatus,
    private readonly tokenSales: TokenSaleRepository,
    private readonly tokenHolders: TokenHolderRepository,
    private readonly notifications: NotificationRepository,
    private readonly tx: TransactionRunner,
  ) {}

  async handle(log: DecodedLog): Promise<void> {
    const escrowAddress = log.address.toLowerCase();
    await this.tx.run(() =>
      this.tokenSales.setStatus(escrowAddress, this.targetStatus),
    );

    if (this.targetStatus === 'cancelled_by_brand') {
      await this.notifyHolders(escrowAddress);
    }
  }

  private async notifyHolders(escrowAddress: string): Promise<void> {
    try {
      const sale = await this.tokenSales.findByEscrowAddress(escrowAddress);
      if (!sale) return;

      let offset = 0;
      for (;;) {
        const { holders, total } = await this.tokenHolders.listByToken(
          sale.tokenId,
          HOLDERS_PAGE_SIZE,
          offset,
        );
        if (holders.length === 0) break;
        await this.notifications.createMany(
          holders.map((holder) => ({
            userId: holder.userId,
            type: 'sale_cancelled_by_brand' as const,
            title: 'A token sale you invested in was cancelled',
            body: 'The brand cancelled its token sale. You can now claim a refund for your investment.',
          })),
        );
        offset += holders.length;
        if (offset >= total) break;
      }
    } catch {
      /* notification non bloquante */
    }
  }
}
