export type TokenTransactionType =
  'purchase' | 'transfer' | 'reward' | 'initial_emission';

/**
 * Mouvement de tokens (table `token_transaction`). `fromUserId` est null pour
 * les émissions/achats primaires. `pricePerToken` est renseigné pour les achats
 * (prix unitaire au moment de l'opération), null sinon.
 */
export class TokenTransaction {
  constructor(
    public readonly id: string,
    public readonly tokenId: string,
    public readonly fromUserId: string | null,
    public readonly toUserId: string,
    public readonly amount: number,
    public readonly transactionType: TokenTransactionType,
    public readonly pricePerToken: number | null,
    public readonly createdAt: Date,
  ) {}
}
