import { Injectable } from '@nestjs/common';
import { Brackets, Repository } from 'typeorm';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
import { TokenTransaction } from '../domain/token-transaction';
import {
  RecordTransactionParams,
  TokenTransactionRepository,
} from '../domain/token-transaction.repository';
import { TokenTransactionOrmEntity } from './token-transaction.orm-entity';

/** Adapter TypeORM du port {@link TokenTransactionRepository}. */
@Injectable()
export class TypeOrmTokenTransactionRepository extends TokenTransactionRepository {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  private get repository(): Repository<TokenTransactionOrmEntity> {
    return this.db.getRepository(TokenTransactionOrmEntity);
  }

  async record(params: RecordTransactionParams): Promise<void> {
    await this.repository.save(
      this.repository.create({
        tokenId: params.tokenId,
        fromUserId: params.fromUserId,
        toUserId: params.toUserId,
        amount: String(params.amount),
        transactionType: params.transactionType,
        pricePerToken:
          params.pricePerToken != null ? String(params.pricePerToken) : null,
      }),
    );
  }

  async listByToken(
    tokenId: string,
    limit: number,
    offset: number,
  ): Promise<{ transactions: TokenTransaction[]; total: number }> {
    const [entities, total] = await this.repository
      .createQueryBuilder('t')
      .where('t.token_id = :tokenId', { tokenId })
      .orderBy('t.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
    return { transactions: entities.map((e) => this.toDomain(e)), total };
  }

  async listByUser(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ transactions: TokenTransaction[]; total: number }> {
    const [entities, total] = await this.repository
      .createQueryBuilder('t')
      .where(
        new Brackets((qb) =>
          qb
            .where('t.from_user_id = :userId', { userId })
            .orWhere('t.to_user_id = :userId', { userId }),
        ),
      )
      .orderBy('t.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
    return { transactions: entities.map((e) => this.toDomain(e)), total };
  }

  private toDomain(e: TokenTransactionOrmEntity): TokenTransaction {
    return new TokenTransaction(
      e.id,
      e.tokenId,
      e.fromUserId,
      e.toUserId,
      Number(e.amount),
      e.transactionType,
      e.pricePerToken != null ? Number(e.pricePerToken) : null,
      e.createdAt,
    );
  }
}
