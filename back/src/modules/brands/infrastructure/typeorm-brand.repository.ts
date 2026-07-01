import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
import { Brand, InterestRef } from '../domain/brand';
import {
  BrandRepository,
  CreateBrandParams,
  ListBrandsParams,
  UpdateBrandFields,
} from '../domain/brand.repository';
import { BrandNotFoundError } from '../domain/brand.errors';
import { BrandOrmEntity } from './brand.orm-entity';

interface InterestRow {
  brand_id: string;
  id: string;
  label: string;
}

/** Adapter TypeORM du port {@link BrandRepository}. Liens interests gérés en SQL. */
@Injectable()
export class TypeOrmBrandRepository extends BrandRepository {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  private get repository(): Repository<BrandOrmEntity> {
    return this.db.getRepository(BrandOrmEntity);
  }

  existsByOwner(ownerId: string): Promise<boolean> {
    return this.repository.existsBy({ userId: ownerId });
  }

  async isNameTaken(name: string, exceptBrandId?: string): Promise<boolean> {
    const qb = this.repository
      .createQueryBuilder('b')
      .where('b.name = :name', { name });
    if (exceptBrandId) {
      qb.andWhere('b.id != :exceptBrandId', { exceptBrandId });
    }
    return (await qb.getCount()) > 0;
  }

  async findById(id: string): Promise<Brand | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;
    const interests = await this.loadInterests([entity.id]);
    return this.toDomain(entity, interests.get(entity.id) ?? []);
  }

  async findByOwnerId(ownerId: string): Promise<Brand | null> {
    const entity = await this.repository.findOne({
      where: { userId: ownerId },
    });
    if (!entity) return null;
    const interests = await this.loadInterests([entity.id]);
    return this.toDomain(entity, interests.get(entity.id) ?? []);
  }

  async findOwnerId(id: string): Promise<string | null> {
    const entity = await this.repository.findOne({
      where: { id },
      select: { userId: true },
    });
    return entity ? entity.userId : null;
  }

  async list(
    params: ListBrandsParams,
  ): Promise<{ brands: Brand[]; total: number }> {
    const qb = this.repository.createQueryBuilder('b');
    if (params.search) {
      qb.andWhere('b.name ILIKE :search', { search: `%${params.search}%` });
    }
    if (params.interestId) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM brand_interest bi
                 WHERE bi.brand_id = b.id AND bi.interest_id = :interestId)`,
        { interestId: params.interestId },
      );
    }
    if (params.excludeBrandIds?.length) {
      qb.andWhere('b.id NOT IN (:...excluded)', {
        excluded: params.excludeBrandIds,
      });
    }
    qb.orderBy('b.created_at', 'DESC').skip(params.offset).take(params.limit);

    const [entities, total] = await qb.getManyAndCount();
    const interests = await this.loadInterests(entities.map((e) => e.id));
    const brands = entities.map((e) =>
      this.toDomain(e, interests.get(e.id) ?? []),
    );
    return { brands, total };
  }

  async create(params: CreateBrandParams): Promise<Brand> {
    const created = this.repository.create({
      userId: params.ownerId,
      name: params.name,
      description: params.description ?? null,
      logoUrl: params.logoUrl ?? null,
      websiteUrl: params.websiteUrl ?? null,
      businessRegistrationNumber: params.businessRegistrationNumber ?? null,
      country: params.country,
      headquartersStreet: params.headquartersStreet,
      headquartersCity: params.headquartersCity,
      headquartersZipCode: params.headquartersZipCode,
      headquartersAddressComplement:
        params.headquartersAddressComplement ?? null,
      socialMedias: params.socialMedias ?? null,
    });
    const saved = await this.repository.save(created);
    await this.linkInterests(saved.id, params.interestIds);
    return this.getOrThrow(saved.id);
  }

  async update(
    id: string,
    fields: UpdateBrandFields,
    interestIds?: string[],
  ): Promise<Brand> {
    await this.repository.update({ id }, fields);
    if (interestIds) {
      await this.repository.manager.query(
        `DELETE FROM brand_interest WHERE brand_id = $1`,
        [id],
      );
      await this.linkInterests(id, interestIds);
    }
    return this.getOrThrow(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  // --- Helpers ---

  private async linkInterests(
    brandId: string,
    interestIds: string[],
  ): Promise<void> {
    for (const interestId of interestIds) {
      await this.repository.manager.query(
        `INSERT INTO brand_interest (brand_id, interest_id)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [brandId, interestId],
      );
    }
  }

  private async loadInterests(
    brandIds: string[],
  ): Promise<Map<string, InterestRef[]>> {
    const map = new Map<string, InterestRef[]>();
    if (brandIds.length === 0) return map;
    const rows = await this.repository.manager.query<InterestRow[]>(
      `SELECT bi.brand_id, i.id, i.label
       FROM brand_interest bi
       JOIN interest i ON i.id = bi.interest_id
       WHERE bi.brand_id = ANY($1)`,
      [brandIds],
    );
    for (const row of rows) {
      const list = map.get(row.brand_id) ?? [];
      list.push({ id: row.id, label: row.label });
      map.set(row.brand_id, list);
    }
    return map;
  }

  private async getOrThrow(id: string): Promise<Brand> {
    const brand = await this.findById(id);
    if (!brand) {
      throw new BrandNotFoundError();
    }
    return brand;
  }

  private toDomain(entity: BrandOrmEntity, interests: InterestRef[]): Brand {
    return new Brand(
      entity.id,
      entity.userId,
      entity.name,
      entity.description,
      entity.logoUrl,
      entity.websiteUrl,
      entity.businessRegistrationNumber,
      entity.country,
      entity.headquartersStreet,
      entity.headquartersCity,
      entity.headquartersZipCode,
      entity.headquartersAddressComplement,
      entity.socialMedias,
      interests,
      entity.createdAt,
      entity.updatedAt,
    );
  }
}
