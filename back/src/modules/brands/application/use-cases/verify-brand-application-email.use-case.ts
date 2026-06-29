import { Injectable } from '@nestjs/common';
import { BrandApplication } from '../../domain/brand-application';
import { BrandApplicationRepository } from '../../domain/brand-application.repository';
import { InvalidOrExpiredApplicationTokenError } from '../../domain/brand.errors';

/** Vérifie l'email d'une candidature via son token (idempotent si déjà vérifié). */
@Injectable()
export class VerifyBrandApplicationEmailUseCase {
  constructor(
    private readonly applicationRepository: BrandApplicationRepository,
  ) {}

  async execute(token: string): Promise<BrandApplication> {
    const found =
      await this.applicationRepository.findByVerificationToken(token);
    if (!found) {
      throw new InvalidOrExpiredApplicationTokenError(
        'Invalid verification token',
      );
    }
    if (found.expiresAt && found.expiresAt < new Date()) {
      throw new InvalidOrExpiredApplicationTokenError(
        'Verification token has expired',
      );
    }
    if (found.application.emailVerified) {
      return found.application;
    }
    return this.applicationRepository.markEmailVerified(found.application.id);
  }
}
