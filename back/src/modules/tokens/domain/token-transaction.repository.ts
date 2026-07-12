import { TokenTransaction, TokenTransactionType } from './token-transaction';

export interface RecordTransactionParams {
  tokenId: string;
  fromUserId: string | null;
  toUserId: string | null;
  amount: number;
  transactionType: TokenTransactionType;
  /** Prix unitaire à l'achat ; null hors `purchase`. */
  pricePerToken?: number | null;
  /**
   * Identité de l'event on-chain source (chain-sync uniquement). Quand
   * `txHash` est renseigné, l'implémentation DOIT être idempotente sur
   * `(txHash, logIndex)` : rejouer le même range de blocs ne doit jamais
   * créer de doublon.
   */
  txHash?: string | null;
  logIndex?: number | null;
  blockNumber?: bigint | null;
  fromAddress?: string | null;
  toAddress?: string | null;
}

/** Repository PORT de la table `token_transaction`. */
export abstract class TokenTransactionRepository {
  /** Idempotent sur `(txHash, logIndex)` quand ces champs sont fournis. */
  abstract record(params: RecordTransactionParams): Promise<void>;
  abstract listByToken(
    tokenId: string,
    limit: number,
    offset: number,
  ): Promise<{ transactions: TokenTransaction[]; total: number }>;
  abstract listByUser(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ transactions: TokenTransaction[]; total: number }>;
  /** RGPD (D9) : NULL-ifie `from_user_id`/`to_user_id` pour cet utilisateur. */
  abstract unlinkUser(userId: string): Promise<void>;
}
