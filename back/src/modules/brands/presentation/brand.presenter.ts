import { ApiProperty } from '@nestjs/swagger';
import { Brand, InterestRef } from '../domain/brand';
import { BrandMedia } from '../domain/brand-media';

class InterestRefResponse {
  @ApiProperty() id: string;
  @ApiProperty() label: string;
}

export class BrandResponse {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) ownerId: string;
  @ApiProperty() name: string;
  @ApiProperty({ type: String, nullable: true }) description: string | null;
  @ApiProperty({ type: String, nullable: true }) logoUrl: string | null;
  @ApiProperty({ type: String, nullable: true }) websiteUrl: string | null;
  @ApiProperty({ type: String, nullable: true })
  businessRegistrationNumber: string | null;
  @ApiProperty() country: string;
  @ApiProperty() headquartersStreet: string;
  @ApiProperty() headquartersCity: string;
  @ApiProperty() headquartersZipCode: string;
  @ApiProperty({ type: String, nullable: true })
  headquartersAddressComplement: string | null;
  @ApiProperty({ type: Object, nullable: true })
  socialMedias: Record<string, string> | null;
  @ApiProperty({ type: InterestRefResponse, isArray: true })
  interests: InterestRef[];
  @ApiProperty({ format: 'date-time' }) createdAt: string;
}

export class PaginatedBrandsResponse {
  @ApiProperty({ type: BrandResponse, isArray: true }) brands: BrandResponse[];
  @ApiProperty() total: number;
}

export class BrandStatsResponse {
  @ApiProperty() tokenHolders: number;
  @ApiProperty() totalRaised: string;
  @ApiProperty({ type: String, nullable: true }) tokenSymbol: string | null;
  @ApiProperty({ type: String, nullable: true }) tokenPrice: string | null;
}

export class BrandMediaResponse {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) brandId: string;
  @ApiProperty() imageUrl: string;
  @ApiProperty() ipfsHash: string;
  @ApiProperty() displayOrder: number;
  @ApiProperty({ format: 'date-time' }) createdAt: string;
}

export const toBrandResponse = (brand: Brand): BrandResponse => ({
  id: brand.id,
  ownerId: brand.ownerId,
  name: brand.name,
  description: brand.description,
  logoUrl: brand.logoUrl,
  websiteUrl: brand.websiteUrl,
  businessRegistrationNumber: brand.businessRegistrationNumber,
  country: brand.country,
  headquartersStreet: brand.headquartersStreet,
  headquartersCity: brand.headquartersCity,
  headquartersZipCode: brand.headquartersZipCode,
  headquartersAddressComplement: brand.headquartersAddressComplement,
  socialMedias: brand.socialMedias,
  interests: brand.interests,
  createdAt: brand.createdAt.toISOString(),
});

export const toBrandMediaResponse = (
  media: BrandMedia,
): BrandMediaResponse => ({
  id: media.id,
  brandId: media.brandId,
  imageUrl: media.imageUrl,
  ipfsHash: media.ipfsHash,
  displayOrder: media.displayOrder,
  createdAt: media.createdAt.toISOString(),
});
