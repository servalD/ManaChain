import { Injectable } from '@nestjs/common';
import { TokenTransaction } from '../../domain/token-transaction';
import { TokenTransactionRepository } from '../../domain/token-transaction.repository';

/** Historique des transactions d'un token (public). */
@Injectable()
export class ListTokenTransactionsUseCase {
  constructor(
    private readonly transactionRepository: TokenTransactionRepository,
  ) {}

  execute(
    tokenId: string,
    limit: number,
    offset: number,
  ): Promise<{ transactions: TokenTransaction[]; total: number }> {
    return this.transactionRepository.listByToken(tokenId, limit, offset);
  }
}
