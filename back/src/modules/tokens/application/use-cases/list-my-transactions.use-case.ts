import { Injectable } from '@nestjs/common';
import { TokenTransaction } from '../../domain/token-transaction';
import { TokenTransactionRepository } from '../../domain/token-transaction.repository';

/** Historique des transactions de l'utilisateur courant. */
@Injectable()
export class ListMyTransactionsUseCase {
  constructor(
    private readonly transactionRepository: TokenTransactionRepository,
  ) {}

  execute(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ transactions: TokenTransaction[]; total: number }> {
    return this.transactionRepository.listByUser(userId, limit, offset);
  }
}
