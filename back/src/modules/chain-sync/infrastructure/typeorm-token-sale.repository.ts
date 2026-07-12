import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
import { TokenSale, TokenSaleStatus } from '../domain/token-sale';
import {
  CreateTokenSaleParams,
  TokenSaleRepository,
} from '../domain/token-sale.repository';
import { TokenSaleOrmEntity } from './token-sale.orm-entity';

/** Adapter TypeORM du port {@link TokenSaleRepository}. */
@Injectable()
export class TypeOrmTokenSaleRepository extends TokenSaleRepository {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  private get repository(): Repository<TokenSaleOrmEntity> {
    return this.db.getRepository(TokenSaleOrmEntity);
  }

  async findByEscrowAddress(escrowAddress: string): Promise<TokenSale | null> {
    const entity = await this.repository.findOne({ where: { escrowAddress } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByTokenId(tokenId: string): Promise<TokenSale | null> {
    const entity = await this.repository.findOne({ where: { tokenId } });
    return entity ? this.toDomain(entity) : null;
  }

  async create(params: CreateTokenSaleParams): Promise<TokenSale> {
    const saved = await this.repository.save(
      this.repository.create({
        tokenId: params.tokenId,
        escrowAddress: params.escrowAddress,
        pricePerToken: params.pricePerToken,
        totalForSale: params.totalForSale,
        startTime: params.startTime,
        endTime: params.endTime,
        deployTxHash: params.deployTxHash,
      }),
    );
    return this.toDomain(saved);
  }

  async increaseSold(escrowAddress: string, amount: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update()
      .set({ soldAmount: () => `sold_amount + ${BigInt(amount)}` })
      .where('escrow_address = :escrowAddress', { escrowAddress })
      .execute();
  }

  async setStatus(
    escrowAddress: string,
    status: TokenSaleStatus,
  ): Promise<void> {
    await this.repository.update({ escrowAddress }, { status });
  }

  async listAllEscrowAddresses(): Promise<string[]> {
    const rows = await this.repository.find({ select: ['escrowAddress'] });
    return rows.map((r) => r.escrowAddress);
  }

  private toDomain(e: TokenSaleOrmEntity): TokenSale {
    return new TokenSale(
      e.id,
      e.tokenId,
      e.escrowAddress,
      e.pricePerToken,
      e.totalForSale,
      e.soldAmount,
      e.startTime,
      e.endTime,
      e.status,
      e.deployTxHash,
      e.createdAt,
      e.updatedAt,
    );
  }
}
