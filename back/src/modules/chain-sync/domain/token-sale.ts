export type TokenSaleStatus =
  'open' | 'closed' | 'cancelled_by_brand' | 'cancelled_by_admin';

/**
 * Vente de token (table `token_sale`, 1 par escrow `TokenSaleEscrow`). Les
 * montants sont conservés en chaîne de caractères (unités brutes on-chain,
 * `NUMERIC(78,0)` côté pg) pour ne jamais perdre de précision en JS.
 */
export class TokenSale {
  constructor(
    public readonly id: string,
    public readonly tokenId: string,
    public readonly escrowAddress: string,
    public readonly pricePerToken: string,
    public readonly totalForSale: string,
    public readonly soldAmount: string,
    public readonly startTime: Date,
    public readonly endTime: Date,
    public readonly status: TokenSaleStatus,
    public readonly deployTxHash: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
