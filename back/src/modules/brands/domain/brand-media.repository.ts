import { BrandMedia } from './brand-media';

/** Repository PORT de la table `brand_media`. */
export abstract class BrandMediaRepository {
  /** Insère un média en lui attribuant le prochain `display_order`. */
  abstract create(
    brandId: string,
    imageUrl: string,
    ipfsHash: string,
  ): Promise<BrandMedia>;
  abstract findByBrand(brandId: string): Promise<BrandMedia[]>;
  abstract findById(mediaId: string): Promise<BrandMedia | null>;
  abstract delete(mediaId: string): Promise<void>;
}
