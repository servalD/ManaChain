import { Injectable } from '@nestjs/common';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
import {
  TwoFactorChallenge,
  TwoFactorChallengeRepository,
} from '../domain/two-factor-challenge.repository';

interface ChallengeRow {
  token: string;
  user_id: string;
  attempts: number;
  expires_at: Date;
}

/**
 * Adapter SQL (raw, pas d'ORM entity) de {@link TwoFactorChallengeRepository} —
 * même approche que `TypeOrmUserBanRepository` pour `user_ban`.
 */
@Injectable()
export class TypeOrmTwoFactorChallengeRepository extends TwoFactorChallengeRepository {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  async create(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.db.manager.query(
      `INSERT INTO user_two_factor_challenge (token, user_id, expires_at)
       VALUES ($1, $2, $3)`,
      [token, userId, expiresAt],
    );
  }

  async find(token: string): Promise<TwoFactorChallenge | null> {
    const rows = await this.db.manager.query<ChallengeRow[]>(
      `SELECT * FROM user_two_factor_challenge WHERE token = $1`,
      [token],
    );
    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async incrementAttempts(token: string): Promise<number> {
    // Contrairement à `INSERT ... RETURNING` (rows renvoyées directement),
    // TypeORM renvoie `UPDATE ... RETURNING` sous forme de tuple
    // `[rows, affectedCount]` — d'où la déstructuration `[rows]` ici.
    const [rows] = await this.db.manager.query<[{ attempts: number }[], number]>(
      `UPDATE user_two_factor_challenge SET attempts = attempts + 1
        WHERE token = $1 RETURNING attempts`,
      [token],
    );
    return rows[0]?.attempts ?? 0;
  }

  async delete(token: string): Promise<void> {
    await this.db.manager.query(
      `DELETE FROM user_two_factor_challenge WHERE token = $1`,
      [token],
    );
  }

  private toDomain(row: ChallengeRow): TwoFactorChallenge {
    return {
      token: row.token,
      userId: row.user_id,
      attempts: row.attempts,
      expiresAt: row.expires_at,
    };
  }
}
