import { Injectable } from '@nestjs/common';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
import { UserBan } from '../domain/user-ban';
import {
  CreateUserBanParams,
  ListUserBansParams,
  UserBanRepository,
} from '../domain/user-ban.repository';

interface UserBanRow {
  id: string;
  user_id: string;
  reason: string;
  banned_by: string;
  banned_at: Date;
  expires_at: Date | null;
  is_permanent: boolean;
  notes: string | null;
}

/**
 * Adapter SQL (raw, pas d'ORM entity) de {@link UserBanRepository} : la table
 * `user_ban` de la baseline n'a pas de mapping TypeORM, même approche que
 * {@link TypeOrmBrandBanReader} en lecture seule.
 */
@Injectable()
export class TypeOrmUserBanRepository extends UserBanRepository {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  async create(params: CreateUserBanParams): Promise<UserBan> {
    const rows = await this.db.manager.query<UserBanRow[]>(
      `INSERT INTO user_ban (user_id, reason, banned_by, expires_at, is_permanent, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        params.userId,
        params.reason,
        params.bannedBy,
        params.expiresAt ?? null,
        params.isPermanent,
        params.notes ?? null,
      ],
    );
    return this.toDomain(rows[0]);
  }

  async findActive(userId: string): Promise<UserBan | null> {
    const rows = await this.db.manager.query<UserBanRow[]>(
      `SELECT * FROM user_ban
        WHERE user_id = $1 AND (is_permanent = TRUE OR expires_at > NOW())
        ORDER BY banned_at DESC LIMIT 1`,
      [userId],
    );
    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async revoke(userId: string): Promise<void> {
    await this.db.manager.query(
      `UPDATE user_ban SET is_permanent = FALSE, expires_at = NOW(), updated_at = NOW()
        WHERE user_id = $1 AND (is_permanent = TRUE OR expires_at > NOW())`,
      [userId],
    );
  }

  async list(
    params: ListUserBansParams,
  ): Promise<{ bans: UserBan[]; total: number }> {
    const rows = await this.db.manager.query<UserBanRow[]>(
      `SELECT * FROM user_ban ORDER BY banned_at DESC LIMIT $1 OFFSET $2`,
      [params.limit, params.offset],
    );
    const countRows = await this.db.manager.query<{ count: string }[]>(
      `SELECT COUNT(*)::int AS count FROM user_ban`,
    );
    return {
      bans: rows.map((r) => this.toDomain(r)),
      total: Number(countRows[0]?.count ?? 0),
    };
  }

  async findActivelyBannedIds(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return [];
    const rows = await this.db.manager.query<{ user_id: string }[]>(
      `SELECT DISTINCT user_id FROM user_ban
        WHERE user_id = ANY($1) AND (is_permanent = TRUE OR expires_at > NOW())`,
      [userIds],
    );
    return rows.map((r) => r.user_id);
  }

  private toDomain(row: UserBanRow): UserBan {
    return new UserBan(
      row.id,
      row.user_id,
      row.reason,
      row.banned_by,
      row.banned_at,
      row.expires_at,
      row.is_permanent,
      row.notes,
    );
  }
}
