export type TokenTransactionType =
  'purchase' | 'transfer' | 'reward' | 'initial_emission';

/**
 * Mouvement de tokens (table `token_transaction`). `fromUserId` est null pour
 * les émissions/achats primaires. (Le schéma ne stocke pas de prix unitaire.)
 */
export class TokenTransaction {
  constructor(
    public readonly id: string,
    public readonly tokenId: string,
    public readonly fromUserId: string | null,
    public readonly toUserId: string,
    public readonly amount: number,
    public readonly transactionType: TokenTransactionType,
    public readonly createdAt: Date,
  ) {}
}
