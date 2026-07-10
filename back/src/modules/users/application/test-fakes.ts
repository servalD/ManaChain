import { randomUUID } from 'node:crypto';
import { TransactionRunner } from '../../../shared/application/transaction-runner';
import { UserBan } from '../domain/user-ban';
import {
  CreateUserBanParams,
  ListUserBansParams,
  UserBanRepository,
} from '../domain/user-ban.repository';

/** Exécute le bloc sans vraie transaction (fakes in-memory). */
export class FakeTransactionRunner extends TransactionRunner {
  run<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}

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
