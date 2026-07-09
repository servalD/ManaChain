/**
 * Registre d'un module événement déployé (table `event_contracts`), rempli
 * par chain-sync — même rôle que `BrandContracts` pour le module `brands`.
 * `ticketSaleAddress` est null tant que `TicketSaleDeployed` n'a pas été vu.
 */
export class EventContracts {
  constructor(
    public readonly eventTicketsAddress: string,
    public readonly brandAddress: string,
    public readonly ticketSaleAddress: string | null,
    public readonly deployTxHash: string,
    public readonly blockNumber: bigint,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
