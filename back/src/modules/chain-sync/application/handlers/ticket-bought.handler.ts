import { Injectable, Logger } from '@nestjs/common';
import { ChainEventHandler } from '../../domain/chain-event-handler';
import { DecodedLog } from '../../domain/chain-reader';
import { EventTicketPurchaseRepository } from '../../domain/event-ticket-purchase.repository';
import { EventRepository } from '../../../events/domain/event.repository';
import { UserRepository } from '../../../users/domain/user.repository';
import { BrandRepository } from '../../../brands/domain/brand.repository';
import { NotificationRepository } from '../../../notifications/domain/notification.repository';
import { TransactionRunner } from '../../../../shared/application/transaction-runner';

/**
 * `Bought` (TicketSale — distinct de `TokenSaleEscrow.Bought`, dispatché dans
 * un groupe de handlers séparé, voir `chain-sync.service.ts`) : trace l'achat
 * en `event_ticket_purchase`. `log.address` EST le ticketSale.
 *
 * Notifie le propriétaire de la marque (best-effort, jamais bloquant — même
 * try/catch que {@link BrandFlagHandler}).
 */
@Injectable()
export class TicketBoughtHandler implements ChainEventHandler {
  readonly eventName = 'Bought';
  private readonly logger = new Logger(TicketBoughtHandler.name);

  constructor(
    private readonly eventRepository: EventRepository,
    private readonly userRepository: UserRepository,
    private readonly purchases: EventTicketPurchaseRepository,
    private readonly brandRepository: BrandRepository,
    private readonly notifications: NotificationRepository,
    private readonly tx: TransactionRunner,
  ) {}

  async handle(log: DecodedLog): Promise<void> {
    const ticketSaleAddress = log.address.toLowerCase();
    const event =
      await this.eventRepository.findByTicketSaleAddress(ticketSaleAddress);
    if (!event) {
      this.logger.warn(
        `Bought on unknown ticket sale ${ticketSaleAddress} — skipped`,
      );
      return;
    }

    const buyerAddress = (log.args.buyer as string).toLowerCase();
    const tokenId = (log.args.tokenId as bigint).toString();
    const quantity = Number(log.args.quantity);
    const paid = (log.args.paid as bigint).toString();

    const buyer =
      await this.userRepository.findByBlockchainAddress(buyerAddress);

    await this.tx.run(() =>
      this.purchases.record({
        eventId: event.id,
        tokenId,
        buyerAddress,
        userId: buyer?.id ?? null,
        quantity,
        paid,
        txHash: log.transactionHash,
        logIndex: log.logIndex,
      }),
    );

    await this.notifyBrandOwner(event.brandId, event.title, quantity);
  }

  private async notifyBrandOwner(
    brandId: string,
    eventTitle: string,
    quantity: number,
  ): Promise<void> {
    try {
      const ownerId = await this.brandRepository.findOwnerId(brandId);
      if (!ownerId) return;
      await this.notifications.create({
        userId: ownerId,
        type: 'ticket_purchased',
        title: 'Tickets were purchased',
        body: `A buyer purchased ${quantity} ticket(s) for "${eventTitle}".`,
      });
    } catch {
      /* notification non bloquante */
    }
  }
}
