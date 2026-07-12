import { Injectable } from '@nestjs/common';
import { EventTicketPurchase } from '../../../chain-sync/domain/event-ticket-purchase';
import { EventTicketPurchaseRepository } from '../../../chain-sync/domain/event-ticket-purchase.repository';

/** Billets achetés par l'utilisateur courant (alimenté par chain-sync). */
@Injectable()
export class ListMyTicketsUseCase {
  constructor(private readonly purchases: EventTicketPurchaseRepository) {}

  execute(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ purchases: EventTicketPurchase[]; total: number }> {
    return this.purchases.listByUser(userId, limit, offset);
  }
}
