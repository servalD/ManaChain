import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandMedia } from '../domain/brand-media';
import { BrandMediaRepository } from '../domain/brand-media.repository';
import { BrandMediaOrmEntity } from './brand-media.orm-entity';

/** Adapter TypeORM du port {@link BrandMediaRepository}. */
@Injectable()
export class TypeOrmBrandMediaRepository extends BrandMediaRepository {
  constructor(
    @InjectRepository(BrandMediaOrmEntity)
    private readonly repository: Repository<BrandMediaOrmEntity>,
  ) {
    super();
  }

  async create(
    brandId: string,
    imageUrl: string,
    ipfsHash: string,
  ): Promise<BrandMedia> {
    const last = await this.repository.findOne({
      where: { brandId },
      order: { displayOrder: 'DESC' },
    });
    const displayOrder = last ? last.displayOrder + 1 : 0;
    const saved = await this.repository.save(
      this.repository.create({ brandId, imageUrl, ipfsHash, displayOrder }),
    );
    return this.toDomain(saved);
  }

  async findByBrand(brandId: string): Promise<BrandMedia[]> {
    const entities = await this.repository.find({
      where: { brandId },
      order: { displayOrder: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findById(mediaId: string): Promise<BrandMedia | null> {
    const entity = await this.repository.findOne({ where: { id: mediaId } });
    return entity ? this.toDomain(entity) : null;
  }

  async delete(mediaId: string): Promise<void> {
    await this.repository.delete({ id: mediaId });
  }

  private toDomain(e: BrandMediaOrmEntity): BrandMedia {
    return new BrandMedia(
      e.id,
      e.brandId,
      e.imageUrl,
      e.ipfsHash,
      e.displayOrder,
      e.createdAt,
    );
  }
}
