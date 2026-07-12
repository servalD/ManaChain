import { randomUUID } from 'node:crypto';
import { BrandApplication } from '../domain/brand-application';
import {
  ApplicationWithExpiry,
  BrandApplicationRepository,
  CreateBrandApplicationParams,
  ListApplicationsParams,
  RegistrationProofFile,
} from '../domain/brand-application.repository';
import { BrandApplicationNotFoundError } from '../domain/brand.errors';

interface Stored {
  application: BrandApplication;
  interestIds: string[];
  verificationToken: string | null;
  verificationExpires: Date | null;
}

/** Fake {@link BrandApplicationRepository} pour les tests unitaires. */
export class InMemoryBrandApplicationRepository extends BrandApplicationRepository {
  private readonly store = new Map<string, Stored>();

  /** Helper de test : précharge une candidature (état contrôlé). */
  seed(
    partial: Partial<BrandApplication> = {},
    interestIds: string[] = [],
  ): BrandApplication {
    const now = new Date();
    const app = new BrandApplication(
      partial.id ?? randomUUID(),
      partial.contactEmail ?? 'contact@example.com',
      partial.contactFirstName ?? 'First',
      partial.contactLastName ?? 'Last',
      partial.contactPhone ?? null,
      partial.brandName ?? 'BrandCo',
      partial.description ?? null,
      partial.websiteUrl ?? null,
      partial.logoUrl ?? null,
      partial.businessRegistrationNumber ?? 'REG-1',
      partial.country ?? 'FR',
      partial.headquartersStreet ?? '1 rue X',
      partial.headquartersCity ?? 'Paris',
      partial.headquartersZipCode ?? '75001',
      partial.headquartersAddressComplement ?? null,
      partial.motivation ?? null,
      partial.estimatedCommunitySize ?? null,
      partial.socialMediaLinks ?? null,
      partial.howDidYouHearAboutUs ?? null,
      partial.registrationProofFileName ?? null,
      partial.status ?? 'pending',
      partial.emailVerified ?? false,
      partial.rejectionReason ?? null,
      partial.createdAt ?? now,
      partial.updatedAt ?? now,
    );
    this.store.set(app.id, {
      application: app,
      interestIds,
      verificationToken: null,
      verificationExpires: null,
    });
    return app;
  }

  isRegistrationNumberTaken(num: string): Promise<boolean> {
    return Promise.resolve(
      [...this.store.values()].some(
        (s) => s.application.businessRegistrationNumber === num,
      ),
    );
  }

  isNameActive(brandName: string): Promise<boolean> {
    return Promise.resolve(
      [...this.store.values()].some(
        (s) =>
          s.application.brandName === brandName &&
          ['pending', 'approved', 'needs_review'].includes(
            s.application.status,
          ),
      ),
    );
  }

  create(params: CreateBrandApplicationParams): Promise<BrandApplication> {
    const app = this.seed(
      {
        contactEmail: params.contactEmail,
        contactFirstName: params.contactFirstName,
        contactLastName: params.contactLastName,
        brandName: params.brandName,
        businessRegistrationNumber: params.businessRegistrationNumber,
        country: params.country,
      },
      params.interestIds,
    );
    const stored = this.store.get(app.id)!;
    stored.verificationToken = params.emailVerificationToken;
    stored.verificationExpires = params.emailVerificationExpires;
    return Promise.resolve(app);
  }

  findById(id: string): Promise<BrandApplication | null> {
    return Promise.resolve(this.store.get(id)?.application ?? null);
  }

  findByVerificationToken(
    token: string,
  ): Promise<ApplicationWithExpiry | null> {
    const stored = [...this.store.values()].find(
      (s) => s.verificationToken === token,
    );
    if (!stored) return Promise.resolve(null);
    return Promise.resolve({
      application: stored.application,
      expiresAt: stored.verificationExpires,
    });
  }

  markEmailVerified(id: string): Promise<BrandApplication> {
    return Promise.resolve(this.replace(id, { emailVerified: true }));
  }

  list(
    params: ListApplicationsParams,
  ): Promise<{ applications: BrandApplication[]; total: number }> {
    const all = [...this.store.values()].map((s) => s.application);
    return Promise.resolve({
      applications: all.slice(params.offset, params.offset + params.limit),
      total: all.length,
    });
  }

  findInterestIds(applicationId: string): Promise<string[]> {
    return Promise.resolve(this.store.get(applicationId)?.interestIds ?? []);
  }

  findRegistrationProofFile(
    _id: string,
  ): Promise<RegistrationProofFile | null> {
    return Promise.resolve(null);
  }

  approve(id: string): Promise<void> {
    this.replace(id, { status: 'approved' });
    return Promise.resolve();
  }

  reject(id: string, _adminId: string, reason: string): Promise<void> {
    this.replace(id, { status: 'rejected', rejectionReason: reason });
    return Promise.resolve();
  }

  private replace(
    id: string,
    changes: Partial<
      Pick<BrandApplication, 'emailVerified' | 'status' | 'rejectionReason'>
    >,
  ): BrandApplication {
    const stored = this.store.get(id);
    if (!stored) throw new BrandApplicationNotFoundError();
    const a = stored.application;
    const updated = new BrandApplication(
      a.id,
      a.contactEmail,
      a.contactFirstName,
      a.contactLastName,
      a.contactPhone,
      a.brandName,
      a.description,
      a.websiteUrl,
      a.logoUrl,
      a.businessRegistrationNumber,
      a.country,
      a.headquartersStreet,
      a.headquartersCity,
      a.headquartersZipCode,
      a.headquartersAddressComplement,
      a.motivation,
      a.estimatedCommunitySize,
      a.socialMediaLinks,
      a.howDidYouHearAboutUs,
      a.registrationProofFileName,
      changes.status ?? a.status,
      changes.emailVerified ?? a.emailVerified,
      changes.rejectionReason !== undefined
        ? changes.rejectionReason
        : a.rejectionReason,
      a.createdAt,
      new Date(),
    );
    stored.application = updated;
    return updated;
  }
}
