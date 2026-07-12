import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ActivityPoint,
  UserActivityHistoryReader,
} from '../domain/user-activity-history.reader';
import { UserOrmEntity } from './user.orm-entity';

interface HistoryRow {
  day: string;
  likes_given: number;
  token_purchases: number;
  events_attended: number;
  support_score: string;
}

/**
 * Adapter SQL de {@link UserActivityHistoryReader}. Comme
 * `TypeOrmBrandTokenStatsReader`, lit directement les tables `brand_like` /
 * `token_transaction` / `event_ticket_purchase` (le module `users` reste
 * découplé au niveau domaine). Les 3 premiers compteurs sont journaliers
 * (nombre d'actions ce jour-là) ; `support_score` est cumulatif depuis le
 * début (somme des quantités de tokens achetées, pas de valeur monétaire).
 */
@Injectable()
export class TypeOrmUserActivityHistoryReader extends UserActivityHistoryReader {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {
    super();
  }

  async getHistory(userId: string, days: number): Promise<ActivityPoint[]> {
    const to = new Date();
    const from = new Date(to);
    from.setUTCDate(from.getUTCDate() - (days - 1));

    const rows = await this.repository.manager.query<HistoryRow[]>(
      `WITH days AS (
         SELECT generate_series($2::date, $3::date, interval '1 day')::date AS day
       )
       SELECT
         d.day::text AS day,
         (
           SELECT COUNT(*) FROM brand_like bl
           WHERE bl.user_id = $1 AND bl.created_at::date = d.day
         )::int AS likes_given,
         (
           SELECT COUNT(*) FROM token_transaction tt
           WHERE tt.to_user_id = $1 AND tt.transaction_type = 'purchase'
             AND tt.created_at::date = d.day
         )::int AS token_purchases,
         (
           SELECT COUNT(*) FROM event_ticket_purchase etp
           WHERE etp.user_id = $1 AND etp.created_at::date = d.day
         )::int AS events_attended,
         COALESCE((
           SELECT SUM(amount) FROM token_transaction tt2
           WHERE tt2.to_user_id = $1 AND tt2.transaction_type = 'purchase'
             AND tt2.created_at::date <= d.day
         ), 0)::numeric AS support_score
       FROM days d
       ORDER BY d.day`,
      [userId, this.toDateParam(from), this.toDateParam(to)],
    );

    return rows.map((r) => ({
      date: r.day,
      likesGiven: Number(r.likes_given),
      tokenPurchases: Number(r.token_purchases),
      eventsAttended: Number(r.events_attended),
      supportScore: Number(r.support_score),
    }));
  }

  private toDateParam(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
