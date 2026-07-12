import { randomUUID } from 'node:crypto';
import { UserBan } from '../domain/user-ban';
import {
  CreateUserBanParams,
  ListUserBansParams,
  UserBanRepository,
} from '../domain/user-ban.repository';
import {
  TwoFactorRecoveryCode,
  TwoFactorRecoveryCodeRepository,
} from '../domain/two-factor-recovery-code.repository';
import {
  ActivityPoint,
  UserActivityHistoryReader,
} from '../domain/user-activity-history.reader';

export { FakeTransactionRunner } from '../../../shared/application/test-fakes';

/** Fake {@link UserBanRepository} en mémoire pour les tests unitaires. */
export class InMemoryUserBanRepository extends UserBanRepository {
  private readonly bans = new Map<string, UserBan>();

  create(params: CreateUserBanParams): Promise<UserBan> {
    const ban = new UserBan(
      randomUUID(),
      params.userId,
      params.reason,
      params.bannedBy,
      new Date(),
      params.expiresAt ?? null,
      params.isPermanent,
      params.notes ?? null,
    );
    this.bans.set(ban.id, ban);
    return Promise.resolve(ban);
  }

  findActive(userId: string): Promise<UserBan | null> {
    const found = [...this.bans.values()]
      .filter((b) => b.userId === userId && b.isActive())
      .sort((a, b) => b.bannedAt.getTime() - a.bannedAt.getTime())[0];
    return Promise.resolve(found ?? null);
  }

  revoke(userId: string): Promise<void> {
    for (const [id, ban] of this.bans.entries()) {
      if (ban.userId === userId && ban.isActive()) {
        this.bans.set(
          id,
          new UserBan(
            ban.id,
            ban.userId,
            ban.reason,
            ban.bannedBy,
            ban.bannedAt,
            new Date(),
            false,
            ban.notes,
          ),
        );
      }
    }
    return Promise.resolve();
  }

  list(
    params: ListUserBansParams,
  ): Promise<{ bans: UserBan[]; total: number }> {
    const all = [...this.bans.values()].sort(
      (a, b) => b.bannedAt.getTime() - a.bannedAt.getTime(),
    );
    return Promise.resolve({
      bans: all.slice(params.offset, params.offset + params.limit),
      total: all.length,
    });
  }
}

/** Fake {@link TwoFactorRecoveryCodeRepository} en mémoire pour les tests unitaires. */
export class InMemoryTwoFactorRecoveryCodeRepository extends TwoFactorRecoveryCodeRepository {
  private readonly codes = new Map<
    string,
    TwoFactorRecoveryCode & { userId: string; usedAt: Date | null }
  >();

  replaceAll(userId: string, codeHashes: string[]): Promise<void> {
    for (const [id, code] of this.codes.entries()) {
      if (code.userId === userId) this.codes.delete(id);
    }
    for (const codeHash of codeHashes) {
      const id = randomUUID();
      this.codes.set(id, { id, userId, codeHash, usedAt: null });
    }
    return Promise.resolve();
  }

  findUnused(userId: string): Promise<TwoFactorRecoveryCode[]> {
    return Promise.resolve(
      [...this.codes.values()]
        .filter((c) => c.userId === userId && !c.usedAt)
        .map(({ id, codeHash }) => ({ id, codeHash })),
    );
  }

  markUsed(id: string): Promise<void> {
    const code = this.codes.get(id);
    if (code) code.usedAt = new Date();
    return Promise.resolve();
  }

  deleteAll(userId: string): Promise<void> {
    for (const [id, code] of this.codes.entries()) {
      if (code.userId === userId) this.codes.delete(id);
    }
    return Promise.resolve();
  }
}

/** Lecteur d'historique d'activité paramétrable (liste vide par défaut). */
export class FakeUserActivityHistoryReader extends UserActivityHistoryReader {
  private readonly byUser = new Map<string, ActivityPoint[]>();
  seedHistory(userId: string, points: ActivityPoint[]): void {
    this.byUser.set(userId, points);
  }
  getHistory(userId: string): Promise<ActivityPoint[]> {
    return Promise.resolve(this.byUser.get(userId) ?? []);
  }
}
