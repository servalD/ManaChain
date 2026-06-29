import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandLookup } from '../domain/brand-lookup';
import { BrandTokenOrmEntity } from './brand-token.orm-entity';

interface IdRow {
  id: string;
}
interface OwnerRow {
  user_id: string;
}

/**
 * Adapter {@link BrandLookup} : lit la table `brand` en SQL (module `brands`
 * gardé découplé ; réutilise le manager du repository des tokens).
 */
@Injectable()
export class TypeOrmBrandLookup extends BrandLookup {
  constructor(
    @InjectRepository(BrandTokenOrmEntity)
    private readonly repository: Repository<BrandTokenOrmEntity>,
  ) {
    super();
  }

  async findBrandIdByOwner(userId: string): Promise<string | null> {
    const rows = await this.repository.manager.query<IdRow[]>(
      `SELECT id FROM brand WHERE user_id = $1 LIMIT 1`,
      [userId],
    );
    return rows.length > 0 ? rows[0].id : null;
  }

  async findOwnerId(brandId: string): Promise<string | null> {
    const rows = await this.repository.manager.query<OwnerRow[]>(
      `SELECT user_id FROM brand WHERE id = $1 LIMIT 1`,
      [brandId],
    );
    return rows.length > 0 ? rows[0].user_id : null;
  }
}
