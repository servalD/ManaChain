export type TokenTransactionType =
  'purchase' | 'transfer' | 'reward' | 'initial_emission' | 'refund';

/**
 * Mouvement de tokens (table `token_transaction`), aujourd'hui alimentée par
 * chain-sync (lecture des events on-chain). `fromUserId`/`toUserId` sont null
 * quand l'adresse impliquée n'est pas (encore) liée à un compte ManaChain —
 * `fromAddress`/`toAddress` restent la source de vérité brute. `txHash`/
 * `logIndex` sont null pour les lignes historiques pré-chain-sync ; sinon ils
 * garantissent l'idempotence du replay (contrainte unique partielle en DB).
 */
export class TokenTransaction {
  constructor(
    public readonly id: string,
    public readonly tokenId: string,
    public readonly fromUserId: string | null,
    public readonly toUserId: string | null,
    public readonly amount: number,
    public readonly transactionType: TokenTransactionType,
    public readonly pricePerToken: number | null,
    public readonly createdAt: Date,
    public readonly txHash: string | null = null,
    public readonly logIndex: number | null = null,
    public readonly blockNumber: string | null = null,
    public readonly fromAddress: string | null = null,
    public readonly toAddress: string | null = null,
  ) {}
}
