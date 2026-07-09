/** Achat de billet (table `event_ticket_purchase`), alimenté par `TicketSale.Bought`. */
export class EventTicketPurchase {
  constructor(
    public readonly id: string,
    public readonly eventId: string,
    public readonly tokenId: string,
    public readonly buyerAddress: string,
    public readonly userId: string | null,
    public readonly quantity: number,
    public readonly paid: string,
    public readonly txHash: string,
    public readonly logIndex: number,
    public readonly createdAt: Date,
  ) {}
}
