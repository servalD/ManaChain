import { Injectable } from '@nestjs/common';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
import {
  TwoFactorRecoveryCode,
  TwoFactorRecoveryCodeRepository,
} from '../domain/two-factor-recovery-code.repository';

interface RecoveryCodeRow {
  id: string;
  code_hash: string;
}

/**
 * Adapter SQL (raw, pas d'ORM entity) de {@link TwoFactorRecoveryCodeRepository} —
 * même approche que {@link TypeOrmUserBanRepository} pour `user_ban`.
 */
@Injectable()
export class TypeOrmTwoFactorRecoveryCodeRepository extends TwoFactorRecoveryCodeRepository {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  async replaceAll(userId: string, codeHashes: string[]): Promise<void> {
    await this.db.manager.query(
      `DELETE FROM user_two_factor_recovery_code WHERE user_id = $1`,
      [userId],
    );
    for (const codeHash of codeHashes) {
      await this.db.manager.query(
        `INSERT INTO user_two_factor_recovery_code (user_id, code_hash)
         VALUES ($1, $2)`,
        [userId, codeHash],
      );
    }
  }

  async findUnused(userId: string): Promise<TwoFactorRecoveryCode[]> {
    const rows = await this.db.manager.query<RecoveryCodeRow[]>(
      `SELECT id, code_hash FROM user_two_factor_recovery_code
        WHERE user_id = $1 AND used_at IS NULL`,
      [userId],
    );
    return rows.map((r) => ({ id: r.id, codeHash: r.code_hash }));
  }

  async markUsed(id: string): Promise<void> {
    await this.db.manager.query(
      `UPDATE user_two_factor_recovery_code SET used_at = NOW() WHERE id = $1`,
      [id],
    );
  }

  async deleteAll(userId: string): Promise<void> {
    await this.db.manager.query(
      `DELETE FROM user_two_factor_recovery_code WHERE user_id = $1`,
      [userId],
    );
  }
}
