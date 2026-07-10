import { randomUUID } from 'node:crypto';
import { BrandApplication } from '../domain/brand-application';
import { BrandApplicationMailer } from '../domain/brand-application-mailer.port';
import {
  BrandTokenStats,
  BrandTokenStatsReader,
} from '../domain/brand-token-stats.reader';
import { BrandBanReader } from '../domain/brand-ban.reader';
import { BrandBan } from '../domain/brand-ban';
import {
  BrandBanRepository,
  CreateBrandBanParams,
  ListBrandBansParams,
} from '../domain/brand-ban.repository';
import { InterestChecker } from '../domain/interest-checker';
import { TemporaryPasswordGenerator } from '../domain/temporary-password-generator';
import { TransactionRunner } from '../../../shared/application/transaction-runner';

/** Exécute le bloc sans vraie transaction (fakes in-memory). */
export class FakeTransactionRunner extends TransactionRunner {
  run<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}

/** Valide les interests selon un ensemble préchargé (tout valide par défaut). */
export class FakeInterestChecker extends InterestChecker {
  private readonly valid: Set<string> | null;
  constructor(validIds?: string[]) {
    super();
    this.valid = validIds ? new Set(validIds) : null;
  }
  allExist(interestIds: string[]): Promise<boolean> {
    if (this.valid === null) return Promise.resolve(true);
    return Promise.resolve(interestIds.every((id) => this.valid!.has(id)));
  }
}

/** Génère un mot de passe temporaire fixe. */
export class FakeTemporaryPasswordGenerator extends TemporaryPasswordGenerator {
  generate(): string {
    return 'Temp1234!@';
  }
}

/** Lecteur de stats token paramétrable (aucun token par défaut → zéros). */
export class FakeBrandTokenStatsReader extends BrandTokenStatsReader {
  private readonly byBrand = new Map<string, BrandTokenStats>();
  seedStats(brandId: string, stats: BrandTokenStats): void {
    this.byBrand.set(brandId, stats);
  }
  getStatsByBrand(brandId: string): Promise<BrandTokenStats> {
    return Promise.resolve(
      this.byBrand.get(brandId) ?? {
        tokenHolders: 0,
        totalRaised: '0',
        tokenSymbol: null,
        tokenPrice: null,
      },
    );
  }
}

/** Lecteur de bans paramétrable (aucun ban par défaut). */
export class FakeBrandBanReader extends BrandBanReader {
  private bannedIds: string[] = [];
  seedBanned(...brandIds: string[]): void {
    this.bannedIds = brandIds;
  }
  findActivelyBannedBrandIds(): Promise<string[]> {
    return Promise.resolve([...this.bannedIds]);
  }
}

/** Fake {@link BrandBanRepository} (écriture) en mémoire pour les tests unitaires. */
export class InMemoryBrandBanRepository extends BrandBanRepository {
  private readonly bans = new Map<string, BrandBan>();

  create(params: CreateBrandBanParams): Promise<BrandBan> {
    const ban = new BrandBan(
      randomUUID(),
      params.brandId,
      params.reason,
      params.bannedBy,
      new Date(),
      params.expiresAt ?? null,
      params.isPermanent,
      params.notes ?? null,
      params.blacklistTxHash ?? null,
      params.cancelSaleTxHash ?? null,
    );
    this.bans.set(ban.id, ban);
    return Promise.resolve(ban);
  }

  findActive(brandId: string): Promise<BrandBan | null> {
    const found = [...this.bans.values()]
      .filter((b) => b.brandId === brandId && b.isActive())
      .sort((a, b) => b.bannedAt.getTime() - a.bannedAt.getTime())[0];
    return Promise.resolve(found ?? null);
  }

  revoke(brandId: string): Promise<void> {
    for (const [id, ban] of this.bans.entries()) {
      if (ban.brandId === brandId && ban.isActive()) {
        this.bans.set(
          id,
          new BrandBan(
            ban.id,
            ban.brandId,
            ban.reason,
            ban.bannedBy,
            ban.bannedAt,
            new Date(),
            false,
            ban.notes,
            ban.blacklistTxHash,
            ban.cancelSaleTxHash,
          ),
        );
      }
    }
    return Promise.resolve();
  }

  list(
    params: ListBrandBansParams,
  ): Promise<{ bans: BrandBan[]; total: number }> {
    const all = [...this.bans.values()].sort(
      (a, b) => b.bannedAt.getTime() - a.bannedAt.getTime(),
    );
    return Promise.resolve({
      bans: all.slice(params.offset, params.offset + params.limit),
      total: all.length,
    });
  }
}

/** Mailer candidatures espion. */
export class FakeBrandApplicationMailer extends BrandApplicationMailer {
  readonly verifications: string[] = [];
  readonly adminNotifications: string[] = [];
  readonly approvals: { to: string; username: string; password: string }[] = [];
  readonly rejections: { to: string; reason: string }[] = [];

  sendVerification(to: string): Promise<void> {
    this.verifications.push(to);
    return Promise.resolve();
  }
  sendAdminNotification(to: string, _app: BrandApplication): Promise<void> {
    this.adminNotifications.push(to);
    return Promise.resolve();
  }
  sendApproved(
    to: string,
    _brandName: string,
    username: string,
    password: string,
  ): Promise<void> {
    this.approvals.push({ to, username, password });
    return Promise.resolve();
  }
  sendRejected(to: string, _brandName: string, reason: string): Promise<void> {
    this.rejections.push({ to, reason });
    return Promise.resolve();
  }
}
