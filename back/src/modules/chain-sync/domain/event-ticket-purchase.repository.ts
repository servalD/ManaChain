import { EventTicketPurchase } from './event-ticket-purchase';

export interface RecordEventTicketPurchaseParams {
  eventId: string;
  tokenId: string;
  buyerAddress: string;
  userId: string | null;
  quantity: number;
  paid: string;
  txHash: string;
  logIndex: number;
}

/** Repository PORT de la table `event_ticket_purchase`. Idempotent sur `(txHash, logIndex)`. */
export abstract class EventTicketPurchaseRepository {
  abstract record(params: RecordEventTicketPurchaseParams): Promise<void>;
  abstract listByUser(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ purchases: EventTicketPurchase[]; total: number }>;
}
