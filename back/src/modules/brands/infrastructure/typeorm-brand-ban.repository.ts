import { Injectable } from '@nestjs/common';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
import { BrandBan } from '../domain/brand-ban';
import {
  BrandBanRepository,
  CreateBrandBanParams,
  ListBrandBansParams,
} from '../domain/brand-ban.repository';

interface BrandBanRow {
  id: string;
  brand_id: string;
  reason: string;
  banned_by: string;
  banned_at: Date;
  expires_at: Date | null;
  is_permanent: boolean;
  notes: string | null;
  blacklist_tx_hash: string | null;
  cancel_sale_tx_hash: string | null;
}

/**
 * Adapter SQL (raw, pas d'ORM entity) de {@link BrandBanRepository} — même
 * approche que {@link TypeOrmBrandBanReader} en lecture seule et que
 * `TypeOrmUserBanRepository` (module users).
 */
@Injectable()
export class TypeOrmBrandBanRepository extends BrandBanRepository {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  async create(params: CreateBrandBanParams): Promise<BrandBan> {
    const rows = await this.db.manager.query<BrandBanRow[]>(
      `INSERT INTO brand_ban
         (brand_id, reason, banned_by, expires_at, is_permanent, notes, blacklist_tx_hash, cancel_sale_tx_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        params.brandId,
        params.reason,
        params.bannedBy,
        params.expiresAt ?? null,
        params.isPermanent,
        params.notes ?? null,
        params.blacklistTxHash ?? null,
        params.cancelSaleTxHash ?? null,
      ],
    );
    return this.toDomain(rows[0]);
  }

  async findActive(brandId: string): Promise<BrandBan | null> {
    const rows = await this.db.manager.query<BrandBanRow[]>(
      `SELECT * FROM brand_ban
        WHERE brand_id = $1 AND (is_permanent = TRUE OR expires_at > NOW())
        ORDER BY banned_at DESC LIMIT 1`,
      [brandId],
    );
    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async revoke(brandId: string): Promise<void> {
    await this.db.manager.query(
      `UPDATE brand_ban SET is_permanent = FALSE, expires_at = NOW(), updated_at = NOW()
        WHERE brand_id = $1 AND (is_permanent = TRUE OR expires_at > NOW())`,
      [brandId],
    );
  }

  async list(
    params: ListBrandBansParams,
  ): Promise<{ bans: BrandBan[]; total: number }> {
    const rows = await this.db.manager.query<BrandBanRow[]>(
      `SELECT * FROM brand_ban ORDER BY banned_at DESC LIMIT $1 OFFSET $2`,
      [params.limit, params.offset],
    );
    const countRows = await this.db.manager.query<{ count: string }[]>(
      `SELECT COUNT(*)::int AS count FROM brand_ban`,
    );
    return {
      bans: rows.map((r) => this.toDomain(r)),
      total: Number(countRows[0]?.count ?? 0),
    };
  }

  private toDomain(row: BrandBanRow): BrandBan {
    return new BrandBan(
      row.id,
      row.brand_id,
      row.reason,
      row.banned_by,
      row.banned_at,
      row.expires_at,
      row.is_permanent,
      row.notes,
      row.blacklist_tx_hash,
      row.cancel_sale_tx_hash,
    );
  }
}
