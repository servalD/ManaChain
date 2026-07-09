export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

/**
 * Modèle de domaine PUR d'un événement. Les adresses on-chain
 * (`eventTicketsAddress`/`ticketSaleAddress`) et `deployTxHash` sont nulles
 * tant que le brand n'a pas déployé son module (voir `link-event-contracts`).
 */
export class Event {
  constructor(
    public readonly id: string,
    public readonly brandId: string,
    public readonly title: string,
    public readonly type: string,
    public readonly description: string | null,
    public readonly addressStreet: string | null,
    public readonly addressCity: string | null,
    public readonly addressZipCode: string | null,
    public readonly addressCountry: string | null,
    public readonly addressComplement: string | null,
    public readonly startsAt: Date,
    public readonly endsAt: Date | null,
    public readonly maxTickets: number | null,
    public readonly minTokenBalance: number,
    public readonly status: EventStatus,
    public readonly coverImageUrl: string | null,
    public readonly eventTicketsAddress: string | null,
    public readonly ticketSaleAddress: string | null,
    public readonly paymentFree: boolean,
    public readonly deployTxHash: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
