import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BrandEngagementHistoryReader,
  EngagementPoint,
} from '../domain/brand-engagement-history.reader';
import { BrandOrmEntity } from './brand.orm-entity';

interface HistoryRow {
  day: string;
  holders: number;
  likes: number;
}

/**
 * Adapter SQL de {@link BrandEngagementHistoryReader}. Comme
 * `TypeOrmBrandTokenStatsReader`, lit directement les tables `brand_token` /
 * `token_holder` / `brand_like` (le module `brands` reste découplé au niveau
 * domaine). "Détenteur à la date D" = ligne `token_holder` avec un solde actuel
 * positif et un `created_at` <= D (première date à laquelle l'utilisateur est
 * devenu détenteur) ; approximation acceptée : ne redescend pas si un
 * détenteur revend intégralement depuis. "Like à la date D" = ligne
 * `brand_like` actuelle (donc toujours active) avec `created_at` <= D.
 */
@Injectable()
export class TypeOrmBrandEngagementHistoryReader extends BrandEngagementHistoryReader {
  constructor(
    @InjectRepository(BrandOrmEntity)
    private readonly repository: Repository<BrandOrmEntity>,
  ) {
    super();
  }

  async getHistory(brandId: string, days: number): Promise<EngagementPoint[]> {
    const to = new Date();
    const from = new Date(to);
    from.setUTCDate(from.getUTCDate() - (days - 1));

    const rows = await this.repository.manager.query<HistoryRow[]>(
      `WITH token AS (
         SELECT id FROM brand_token WHERE brand_id = $1 LIMIT 1
       ),
       days AS (
         SELECT generate_series($2::date, $3::date, interval '1 day')::date AS day
       )
       SELECT
         d.day::text AS day,
         COALESCE((
           SELECT COUNT(*) FROM token_holder th
           WHERE th.token_id = (SELECT id FROM token)
             AND th.balance > 0
             AND th.created_at::date <= d.day
         ), 0)::int AS holders,
         (
           SELECT COUNT(*) FROM brand_like bl
           WHERE bl.brand_id = $1 AND bl.created_at::date <= d.day
         )::int AS likes
       FROM days d
       ORDER BY d.day`,
      [brandId, this.toDateParam(from), this.toDateParam(to)],
    );

    return rows.map((r) => ({
      date: r.day,
      holders: r.holders,
      likes: r.likes,
    }));
  }

  private toDateParam(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
