import { TokenTransaction, TokenTransactionType } from './token-transaction';

export interface RecordTransactionParams {
  tokenId: string;
  fromUserId: string | null;
  toUserId: string;
  amount: number;
  transactionType: TokenTransactionType;
}

/** Repository PORT de la table `token_transaction`. */
export abstract class TokenTransactionRepository {
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
}
