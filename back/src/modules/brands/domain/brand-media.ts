/** Média (image IPFS) d'une marque (table `brand_media`). */
export class BrandMedia {
  constructor(
    public readonly id: string,
    public readonly brandId: string,
    public readonly imageUrl: string,
    public readonly ipfsHash: string,
    public readonly displayOrder: number,
    public readonly createdAt: Date,
  ) {}
}
