import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from '../domain/token';
import { TokenHolder } from '../domain/token-holder';
import {
  PortfolioEntry,
  TokenHolderRepository,
} from '../domain/token-holder.repository';
import { TokenHolderOrmEntity } from './token-holder.orm-entity';
import { BrandTokenOrmEntity } from './brand-token.orm-entity';

/** Adapter TypeORM du port {@link TokenHolderRepository}. */
@Injectable()
export class TypeOrmTokenHolderRepository extends TokenHolderRepository {
  constructor(
    @InjectRepository(TokenHolderOrmEntity)
    private readonly repository: Repository<TokenHolderOrmEntity>,
  ) {
    super();
  }

  async getBalance(userId: string, tokenId: string): Promise<number> {
    const entity = await this.repository.findOne({
      where: { userId, tokenId },
    });
    return entity ? Number(entity.balance) : 0;
  }

  async setBalance(
    userId: string,
    tokenId: string,
    balance: number,
  ): Promise<void> {
    const existing = await this.repository.findOne({
      where: { userId, tokenId },
    });
    if (existing) {
      await this.repository.update(
        { id: existing.id },
        { balance: String(balance) },
      );
    } else {
      await this.repository.save(
        this.repository.create({ userId, tokenId, balance: String(balance) }),
      );
    }
  }

  async listByToken(
    tokenId: string,
    limit: number,
    offset: number,
  ): Promise<{ holders: TokenHolder[]; total: number }> {
    const [entities, total] = await this.repository
      .createQueryBuilder('h')
      .where('h.token_id = :tokenId AND h.balance > 0', { tokenId })
      .orderBy('h.balance', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
    return { holders: entities.map((e) => this.toDomain(e)), total };
  }

  async listPortfolio(userId: string): Promise<PortfolioEntry[]> {
    const holders = await this.repository
      .createQueryBuilder('h')
      .where('h.user_id = :userId AND h.balance > 0', { userId })
      .orderBy('h.balance', 'DESC')
      .getMany();
    if (holders.length === 0) return [];

    const tokens = await this.repository.manager.find(BrandTokenOrmEntity, {
      where: holders.map((h) => ({ id: h.tokenId })),
    });
    const tokenById = new Map(tokens.map((t) => [t.id, t]));

    return holders.flatMap((h) => {
      const token = tokenById.get(h.tokenId);
      return token
        ? [{ holder: this.toDomain(h), token: this.tokenToDomain(token) }]
        : [];
    });
  }

  private toDomain(e: TokenHolderOrmEntity): TokenHolder {
    return new TokenHolder(
      e.id,
      e.userId,
      e.tokenId,
      Number(e.balance),
      e.createdAt,
      e.updatedAt,
    );
  }

  private tokenToDomain(e: BrandTokenOrmEntity): Token {
    return new Token(
      e.id,
      e.brandId,
      e.symbol,
      Number(e.totalSupply),
      e.currentPrice,
      e.nftTokenId,
      e.nftName,
      e.nftSymbol,
      e.createdAt,
      e.updatedAt,
    );
  }
}
