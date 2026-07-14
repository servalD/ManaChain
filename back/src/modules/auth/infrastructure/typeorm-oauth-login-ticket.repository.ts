import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
import { OAuthLoginTicketRepository } from '../domain/oauth-login-ticket.repository';

/**
 * Adapter SQL (raw, pas d'ORM entity) — même approche que
 * `TypeOrmRefreshTokenRepository` (hash SHA-256, jamais le jeton en clair).
 */
@Injectable()
export class TypeOrmOAuthLoginTicketRepository extends OAuthLoginTicketRepository {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  async create(
    userId: string,
    ticket: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.db.manager.query(
      `INSERT INTO oauth_login_ticket (ticket_hash, user_id, expires_at)
       VALUES ($1, $2, $3)`,
      [this.hash(ticket), userId, expiresAt],
    );
  }

  async redeem(ticket: string): Promise<string | null> {
    // UPDATE ... RETURNING renvoie un tuple [rows, affectedCount] via
    // TypeORM (contrairement à INSERT ... RETURNING) — cf.
    // TypeOrmTwoFactorChallengeRepository.incrementAttempts.
    const [rows] = await this.db.manager.query<[{ user_id: string }[], number]>(
      `UPDATE oauth_login_ticket SET used_at = NOW()
       WHERE ticket_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       RETURNING user_id`,
      [this.hash(ticket)],
    );
    return rows[0]?.user_id ?? null;
  }

  private hash(ticket: string): string {
    return createHash('sha256').update(ticket).digest('hex');
  }
}
