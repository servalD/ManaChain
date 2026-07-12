import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
import {
  RefreshTokenRecord,
  RefreshTokenRepository,
} from '../domain/refresh-token.repository';

interface RefreshTokenRow {
  user_id: string;
  expires_at: Date;
  revoked_at: Date | null;
}

/**
 * Adapter SQL (raw, pas d'ORM entity) — même approche que
 * `TypeOrmTwoFactorChallengeRepository`. Le hash SHA-256 est un détail
 * d'implémentation : les use-cases n'en ont jamais connaissance.
 */
@Injectable()
export class TypeOrmRefreshTokenRepository extends RefreshTokenRepository {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  async create(userId: string, token: string, expiresAt: Date): Promise<void> {
    await this.db.manager.query(
      `INSERT INTO refresh_token (token_hash, user_id, expires_at)
       VALUES ($1, $2, $3)`,
      [this.hash(token), userId, expiresAt],
    );
  }

  async find(token: string): Promise<RefreshTokenRecord | null> {
    const rows = await this.db.manager.query<RefreshTokenRow[]>(
      `SELECT user_id, expires_at, revoked_at FROM refresh_token WHERE token_hash = $1`,
      [this.hash(token)],
    );
    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async revoke(token: string): Promise<void> {
    await this.db.manager.query(
      `UPDATE refresh_token SET revoked_at = NOW()
       WHERE token_hash = $1 AND revoked_at IS NULL`,
      [this.hash(token)],
    );
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db.manager.query(
      `UPDATE refresh_token SET revoked_at = NOW()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId],
    );
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toDomain(row: RefreshTokenRow): RefreshTokenRecord {
    return {
      userId: row.user_id,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
    };
  }
}
