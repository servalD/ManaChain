import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { TokenTransaction } from '../domain/token-transaction';
import {
  RecordTransactionParams,
  TokenTransactionRepository,
} from '../domain/token-transaction.repository';
import { TokenTransactionOrmEntity } from './token-transaction.orm-entity';

/** Adapter TypeORM du port {@link TokenTransactionRepository}. */
@Injectable()
export class TypeOrmTokenTransactionRepository extends TokenTransactionRepository {
  constructor(
    @InjectRepository(TokenTransactionOrmEntity)
    private readonly repository: Repository<TokenTransactionOrmEntity>,
  ) {
    super();
  }

  async record(params: RecordTransactionParams): Promise<void> {
    await this.repository.save(
      this.repository.create({
        tokenId: params.tokenId,
        fromUserId: params.fromUserId,
        toUserId: params.toUserId,
        amount: String(params.amount),
        transactionType: params.transactionType,
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
      e.createdAt,
    );
  }
}
