export type BrandApplicationStatus =
  'pending' | 'approved' | 'rejected' | 'needs_review';

/**
 * Modèle de domaine PUR d'une candidature de marque (table `brand_application`).
 * Cycle : pending → approved (crée user + brand) ou rejected.
 */
export class BrandApplication {
  constructor(
    public readonly id: string,
    public readonly contactEmail: string,
    public readonly contactFirstName: string,
    public readonly contactLastName: string,
    public readonly contactPhone: string | null,
    public readonly brandName: string,
    public readonly description: string | null,
    public readonly websiteUrl: string | null,
    public readonly logoUrl: string | null,
    public readonly businessRegistrationNumber: string,
    public readonly country: string,
    public readonly headquartersStreet: string,
    public readonly headquartersCity: string,
    public readonly headquartersZipCode: string,
    public readonly headquartersAddressComplement: string | null,
    public readonly motivation: string | null,
    public readonly estimatedCommunitySize: number | null,
    public readonly socialMediaLinks: Record<string, string> | null,
    public readonly howDidYouHearAboutUs: string | null,
    public readonly registrationProofUrl: string | null,
    public readonly status: BrandApplicationStatus,
    public readonly emailVerified: boolean,
    public readonly rejectionReason: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  canBeReviewed(): boolean {
    return this.status === 'pending' || this.status === 'needs_review';
  }
}
