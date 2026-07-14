import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
import {
  TwoFactorChallenge,
  TwoFactorChallengeRepository,
} from '../domain/two-factor-challenge.repository';

interface ChallengeRow {
  user_id: string;
  attempts: number;
  expires_at: Date;
}

/**
 * Adapter SQL (raw, pas d'ORM entity) de {@link TwoFactorChallengeRepository} —
 * même approche que `TypeOrmRefreshTokenRepository`/`TypeOrmOAuthLoginTicketRepository`
 * (hash SHA-256, jamais le jeton en clair en base).
 */
@Injectable()
export class TypeOrmTwoFactorChallengeRepository extends TwoFactorChallengeRepository {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  async create(userId: string, token: string, expiresAt: Date): Promise<void> {
    await this.db.manager.query(
      `INSERT INTO user_two_factor_challenge (token_hash, user_id, expires_at)
       VALUES ($1, $2, $3)`,
      [this.hash(token), userId, expiresAt],
    );
  }

  async find(token: string): Promise<TwoFactorChallenge | null> {
    const rows = await this.db.manager.query<ChallengeRow[]>(
      `SELECT user_id, attempts, expires_at FROM user_two_factor_challenge WHERE token_hash = $1`,
      [this.hash(token)],
    );
    return rows[0] ? this.toDomain(token, rows[0]) : null;
  }

  async incrementAttempts(token: string): Promise<number> {
    // Contrairement à `INSERT ... RETURNING` (rows renvoyées directement),
    // TypeORM renvoie `UPDATE ... RETURNING` sous forme de tuple
    // `[rows, affectedCount]` — d'où la déstructuration `[rows]` ici.
    const [rows] = await this.db.manager.query<
      [{ attempts: number }[], number]
    >(
      `UPDATE user_two_factor_challenge SET attempts = attempts + 1
        WHERE token_hash = $1 RETURNING attempts`,
      [this.hash(token)],
    );
    return rows[0]?.attempts ?? 0;
  }

  async delete(token: string): Promise<void> {
    await this.db.manager.query(
      `DELETE FROM user_two_factor_challenge WHERE token_hash = $1`,
      [this.hash(token)],
    );
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toDomain(token: string, row: ChallengeRow): TwoFactorChallenge {
    return {
      token,
      userId: row.user_id,
      attempts: row.attempts,
      expiresAt: row.expires_at,
    };
  }
}
