import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
import { BrandContracts } from '../domain/brand-contracts';
import {
  BrandContractsRepository,
  CreateBrandContractsParams,
} from '../domain/brand-contracts.repository';
import { BrandContractsOrmEntity } from './brand-contracts.orm-entity';

/** Adapter TypeORM du port {@link BrandContractsRepository}. */
@Injectable()
export class TypeOrmBrandContractsRepository extends BrandContractsRepository {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  private get repository(): Repository<BrandContractsOrmEntity> {
    return this.db.getRepository(BrandContractsOrmEntity);
  }

  async findByBrandAddress(
    brandAddress: string,
  ): Promise<BrandContracts | null> {
    const entity = await this.repository.findOne({ where: { brandAddress } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByBrandId(brandId: string): Promise<BrandContracts | null> {
    const entity = await this.repository.findOne({ where: { brandId } });
    return entity ? this.toDomain(entity) : null;
  }

  async findBySupportTokenAddress(
    supportTokenAddress: string,
  ): Promise<BrandContracts | null> {
    const entity = await this.repository.findOne({
      where: { supportTokenAddress },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async create(params: CreateBrandContractsParams): Promise<BrandContracts> {
    const saved = await this.repository.save(
      this.repository.create({
        brandId: params.brandId,
        brandAddress: params.brandAddress,
        genesisNftAddress: params.genesisNftAddress,
        vaultAddress: params.vaultAddress,
        supportTokenAddress: params.supportTokenAddress,
        deployTxHash: params.deployTxHash,
        blockNumber: params.blockNumber.toString(),
      }),
    );
    return this.toDomain(saved);
  }

  async linkBrand(brandAddress: string, brandId: string): Promise<void> {
    await this.repository.update({ brandAddress }, { brandId });
  }

  async setWhitelisted(
    brandAddress: string,
    whitelisted: boolean,
  ): Promise<void> {
    await this.repository.update({ brandAddress }, { whitelisted });
  }

  async setBlacklisted(
    brandAddress: string,
    blacklisted: boolean,
  ): Promise<void> {
    await this.repository.update({ brandAddress }, { blacklisted });
  }

  async listSupportTokenAddresses(): Promise<string[]> {
    const rows = await this.repository.find({
      select: ['supportTokenAddress'],
    });
    return rows.map((r) => r.supportTokenAddress);
  }

  private toDomain(e: BrandContractsOrmEntity): BrandContracts {
    return new BrandContracts(
      e.id,
      e.brandId,
      e.brandAddress,
      e.genesisNftAddress,
      e.vaultAddress,
      e.supportTokenAddress,
      e.whitelisted,
      e.blacklisted,
      e.deployTxHash,
      BigInt(e.blockNumber),
      e.createdAt,
      e.updatedAt,
    );
  }
}
