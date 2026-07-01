import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandBanReader } from '../domain/brand-ban.reader';
import { BrandOrmEntity } from './brand.orm-entity';

interface BrandIdRow {
  brand_id: string;
}

/**
 * Adapter SQL de {@link BrandBanReader} : lit la table `brand_ban` (réutilise le
 * manager du repository des marques). Ban actif = permanent ou non expiré.
 */
@Injectable()
export class TypeOrmBrandBanReader extends BrandBanReader {
  constructor(
    @InjectRepository(BrandOrmEntity)
    private readonly repository: Repository<BrandOrmEntity>,
  ) {
    super();
  }

  async findActivelyBannedBrandIds(): Promise<string[]> {
    const rows = await this.repository.manager.query<BrandIdRow[]>(
      `SELECT DISTINCT brand_id FROM brand_ban
        WHERE is_permanent = TRUE OR expires_at > NOW()`,
    );
    return rows.map((r) => r.brand_id);
  }
}
