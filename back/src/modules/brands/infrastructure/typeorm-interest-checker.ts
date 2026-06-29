import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterestChecker } from '../domain/interest-checker';
import { BrandOrmEntity } from './brand.orm-entity';

interface CountRow {
  count: string;
}

/**
 * Adapter {@link InterestChecker} : valide l'existence des interests en SQL
 * (réutilise le manager du repository des marques ; pas d'entité `interest`).
 */
@Injectable()
export class TypeOrmInterestChecker extends InterestChecker {
  constructor(
    @InjectRepository(BrandOrmEntity)
    private readonly repository: Repository<BrandOrmEntity>,
  ) {
    super();
  }

  async allExist(interestIds: string[]): Promise<boolean> {
    if (interestIds.length === 0) return false;
    const unique = [...new Set(interestIds)];
    const rows = await this.repository.manager.query<CountRow[]>(
      `SELECT COUNT(*)::text AS count FROM interest WHERE id = ANY($1)`,
      [unique],
    );
    return Number(rows[0]?.count ?? 0) === unique.length;
  }
}
