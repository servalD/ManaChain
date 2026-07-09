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
    const entity = {
      tokenId: params.tokenId,
      fromUserId: params.fromUserId,
      toUserId: params.toUserId,
      amount: String(params.amount),
      transactionType: params.transactionType,
      pricePerToken:
        params.pricePerToken != null ? String(params.pricePerToken) : null,
      txHash: params.txHash ?? null,
      logIndex: params.logIndex ?? null,
      blockNumber:
        params.blockNumber != null ? String(params.blockNumber) : null,
      fromAddress: params.fromAddress ?? null,
      toAddress: params.toAddress ?? null,
    };
    if (params.txHash != null) {
      // Idempotence chain-sync : rejouer le même (txHash, logIndex) ne doit
      // jamais créer de doublon (contrainte unique partielle en DB).
      await this.repository
        .createQueryBuilder()
        .insert()
        .values(entity)
        .orIgnore()
        .execute();
      return;
    }
    await this.repository.save(this.repository.create(entity));
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

  async unlinkUser(userId: string): Promise<void> {
    await this.repository.update({ fromUserId: userId }, { fromUserId: null });
    await this.repository.update({ toUserId: userId }, { toUserId: null });
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
      e.txHash,
      e.logIndex,
      e.blockNumber,
      e.fromAddress,
      e.toAddress,
    );
  }
}
