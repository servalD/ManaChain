import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BrandApplicationProofUploadStore } from '../domain/brand-application-proof-upload.store';

const MAX_AGE_MS = 48 * 60 * 60 * 1000; // 48h

/** Purge les justificatifs uploadés puis jamais rattachés à une candidature (formulaire abandonné). */
@Injectable()
export class RegistrationProofUploadCleanupScheduler {
  private readonly logger = new Logger(
    RegistrationProofUploadCleanupScheduler.name,
  );

  constructor(private readonly store: BrandApplicationProofUploadStore) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async run(): Promise<void> {
    const deleted = await this.store.deleteOlderThan(
      new Date(Date.now() - MAX_AGE_MS),
    );
    if (deleted > 0) {
      this.logger.log(
        `Deleted ${deleted} orphaned registration-proof upload(s)`,
      );
    }
  }
}
