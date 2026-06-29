import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandDirectory } from '../domain/brand-directory';
import { BrandLikeOrmEntity } from './brand-like.orm-entity';

interface OwnerRow {
  user_id: string;
}

/**
 * Adapter {@link BrandDirectory} : lit la table `brand` en SQL (le module
 * `brands` n'est pas encore migré). Réutilise le manager du repository des likes.
 */
@Injectable()
export class TypeOrmBrandDirectory extends BrandDirectory {
  constructor(
    @InjectRepository(BrandLikeOrmEntity)
    private readonly repository: Repository<BrandLikeOrmEntity>,
  ) {
    super();
  }

  async exists(brandId: string): Promise<boolean> {
    return (await this.findOwnerId(brandId)) !== null;
  }

  async findOwnerId(brandId: string): Promise<string | null> {
    const rows = await this.repository.manager.query<OwnerRow[]>(
      `SELECT user_id FROM brand WHERE id = $1 LIMIT 1`,
      [brandId],
    );
    return rows.length > 0 ? rows[0].user_id : null;
  }
}
