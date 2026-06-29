import { BrandApplication, BrandApplicationStatus } from './brand-application';

export interface CreateBrandApplicationParams {
  contactEmail: string;
  contactFirstName: string;
  contactLastName: string;
  contactPhone?: string | null;
  brandName: string;
  description?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  businessRegistrationNumber: string;
  country: string;
  headquartersStreet: string;
  headquartersCity: string;
  headquartersZipCode: string;
  headquartersAddressComplement?: string | null;
  motivation?: string | null;
  estimatedCommunitySize?: number | null;
  socialMediaLinks?: Record<string, string> | null;
  howDidYouHearAboutUs?: string | null;
  registrationProofUrl?: string | null;
  interestIds: string[];
  emailVerificationToken: string;
  emailVerificationExpires: Date;
}

export interface ListApplicationsParams {
  limit: number;
  offset: number;
  status?: BrandApplicationStatus;
  search?: string;
}

export interface ApplicationWithExpiry {
  application: BrandApplication;
  expiresAt: Date | null;
}

/** Repository PORT de la table `brand_application` (+ `brand_application_interest`). */
export abstract class BrandApplicationRepository {
  abstract isRegistrationNumberTaken(num: string): Promise<boolean>;
  /** Nom déjà utilisé par une candidature active (pending/approved/needs_review). */
  abstract isNameActive(brandName: string): Promise<boolean>;
  abstract create(
    params: CreateBrandApplicationParams,
  ): Promise<BrandApplication>;
  abstract findById(id: string): Promise<BrandApplication | null>;
  abstract findByVerificationToken(
    token: string,
  ): Promise<ApplicationWithExpiry | null>;
  abstract markEmailVerified(id: string): Promise<BrandApplication>;
  abstract list(
    params: ListApplicationsParams,
  ): Promise<{ applications: BrandApplication[]; total: number }>;
  abstract findInterestIds(applicationId: string): Promise<string[]>;
  abstract approve(id: string, adminUserId: string): Promise<void>;
  abstract reject(
    id: string,
    adminUserId: string,
    rejectionReason: string,
  ): Promise<void>;
}
