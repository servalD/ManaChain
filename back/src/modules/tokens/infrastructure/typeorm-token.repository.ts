import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from '../domain/token';
import { CreateTokenParams, TokenRepository } from '../domain/token.repository';
import { TokenNotFoundError } from '../domain/token.errors';
import { BrandTokenOrmEntity } from './brand-token.orm-entity';

/** Adapter TypeORM du port {@link TokenRepository}. Convertit les décimaux pg. */
@Injectable()
export class TypeOrmTokenRepository extends TokenRepository {
  constructor(
    @InjectRepository(BrandTokenOrmEntity)
    private readonly repository: Repository<BrandTokenOrmEntity>,
  ) {
    super();
  }

  async findById(id: string): Promise<Token | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByBrandId(brandId: string): Promise<Token | null> {
    const entity = await this.repository.findOne({ where: { brandId } });
    return entity ? this.toDomain(entity) : null;
  }

  existsByBrandId(brandId: string): Promise<boolean> {
    return this.repository.existsBy({ brandId });
  }

  isSymbolTaken(symbol: string): Promise<boolean> {
    return this.repository.existsBy({ symbol });
  }

  async create(params: CreateTokenParams): Promise<Token> {
    const saved = await this.repository.save(
      this.repository.create({
        brandId: params.brandId,
        symbol: params.symbol,
        totalSupply: String(params.totalSupply),
        currentPrice: params.currentPrice,
        nftTokenId: params.nftTokenId ?? null,
        nftName: params.nftName ?? null,
        nftSymbol: params.nftSymbol ?? null,
      }),
    );
    return this.toDomain(saved);
  }

  async updatePrice(tokenId: string, price: string): Promise<Token> {
    await this.repository.update({ id: tokenId }, { currentPrice: price });
    return this.getOrThrow(tokenId);
  }

  async increaseSupply(tokenId: string, amount: number): Promise<void> {
    const entity = await this.repository.findOne({ where: { id: tokenId } });
    if (!entity) throw new TokenNotFoundError();
    const next = Number(entity.totalSupply) + amount;
    await this.repository.update(
      { id: tokenId },
      { totalSupply: String(next) },
    );
  }

  private async getOrThrow(id: string): Promise<Token> {
    const token = await this.findById(id);
    if (!token) throw new TokenNotFoundError();
    return token;
  }

  private toDomain(e: BrandTokenOrmEntity): Token {
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
