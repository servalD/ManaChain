/** Référence d'un centre d'intérêt rattaché à une marque (table `interest`). */
export interface InterestRef {
  id: string;
  label: string;
}

/**
 * Modèle de domaine PUR d'une marque (table `brand`). La catégorisation se fait
 * par centres d'intérêt (`brand_interest`), conformément au schéma — pas de champ
 * `category`. `interests` est peuplé par l'adapter lors des lectures.
 */
export class Brand {
  constructor(
    public readonly id: string,
    public readonly ownerId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly logoUrl: string | null,
    public readonly websiteUrl: string | null,
    public readonly businessRegistrationNumber: string | null,
    public readonly country: string,
    public readonly headquartersStreet: string,
    public readonly headquartersCity: string,
    public readonly headquartersZipCode: string,
    public readonly headquartersAddressComplement: string | null,
    public readonly socialMedias: Record<string, string> | null,
    public readonly interests: InterestRef[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
