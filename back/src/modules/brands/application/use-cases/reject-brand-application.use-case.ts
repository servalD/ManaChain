import { Injectable } from '@nestjs/common';
import { BrandApplicationRepository } from '../../domain/brand-application.repository';
import { BrandApplicationMailer } from '../../domain/brand-application-mailer.port';
import {
  ApplicationNotReviewableError,
  BrandApplicationNotFoundError,
} from '../../domain/brand.errors';
import { bestEffort } from '../../../../shared/application/best-effort';

/** Rejette une candidature (admin) avec un motif, puis notifie le contact. */
@Injectable()
export class RejectBrandApplicationUseCase {
  constructor(
    private readonly applicationRepository: BrandApplicationRepository,
    private readonly mailer: BrandApplicationMailer,
  ) {}

  async execute(
    adminUserId: string,
    applicationId: string,
    rejectionReason: string,
  ): Promise<void> {
    const application =
      await this.applicationRepository.findById(applicationId);
    if (!application) {
      throw new BrandApplicationNotFoundError();
    }
    if (!application.canBeReviewed()) {
      throw new ApplicationNotReviewableError();
    }

    await this.applicationRepository.reject(
      applicationId,
      adminUserId,
      rejectionReason,
    );

    await bestEffort('brand application rejected email', () =>
      this.mailer.sendRejected(
        application.contactEmail,
        application.brandName,
        rejectionReason,
      ),
    );
  }
}
