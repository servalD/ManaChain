/** Type de billet d'un événement (table `event_ticket_type`), alimenté par `PriceSet`/`TicketsMinted`. */
export class EventTicketType {
  constructor(
    public readonly id: string,
    public readonly eventId: string,
    public readonly tokenId: string,
    public readonly price: string,
    public readonly mintedQuantity: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
