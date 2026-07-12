import { ApiProperty } from '@nestjs/swagger';
import { toIso } from '../../../shared/presentation/date';
import { Brand, InterestRef } from '../domain/brand';
import { BrandMedia } from '../domain/brand-media';
import { InterestSummary } from '../domain/interest-reader';
import { BrandBanEntry } from '../application/use-cases/list-brand-bans.use-case';

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

export class BrandWhitelistEntryResponse {
  @ApiProperty({ type: BrandResponse }) brand: BrandResponse;
  @ApiProperty({ type: String, nullable: true }) ownerBlockchainAddress:
    string | null;
}

export class PaginatedBrandWhitelistResponse {
  @ApiProperty({ type: BrandWhitelistEntryResponse, isArray: true })
  brands: BrandWhitelistEntryResponse[];
  @ApiProperty() total: number;
}

export class BrandStatsResponse {
  @ApiProperty() tokenHolders: number;
  @ApiProperty() totalRaised: string;
  @ApiProperty({ type: String, nullable: true }) tokenSymbol: string | null;
  @ApiProperty({ type: String, nullable: true }) tokenPrice: string | null;
}

export class EngagementPointResponse {
  @ApiProperty() date: string;
  @ApiProperty() holders: number;
  @ApiProperty() likes: number;
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
  createdAt: toIso(brand.createdAt),
});

export class InterestResponse {
  @ApiProperty() id: string;
  @ApiProperty() label: string;
  @ApiProperty({ type: String, nullable: true }) icon: string | null;
}

export const toInterestResponse = (i: InterestSummary): InterestResponse => ({
  id: i.id,
  label: i.label,
  icon: i.icon,
});

export const toBrandMediaResponse = (
  media: BrandMedia,
): BrandMediaResponse => ({
  id: media.id,
  brandId: media.brandId,
  imageUrl: media.imageUrl,
  ipfsHash: media.ipfsHash,
  displayOrder: media.displayOrder,
  createdAt: toIso(media.createdAt),
});

export class BrandBanResponse {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) brandId: string;
  @ApiProperty({ type: String, nullable: true }) brandName: string | null;
  @ApiProperty() reason: string;
  @ApiProperty({ format: 'uuid' }) bannedBy: string;
  @ApiProperty({ type: String, nullable: true }) bannedByUsername:
    string | null;
  @ApiProperty({ format: 'date-time' }) bannedAt: string;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  expiresAt: string | null;
  @ApiProperty() isPermanent: boolean;
  @ApiProperty({ type: String, nullable: true }) notes: string | null;
  @ApiProperty({ type: String, nullable: true }) blacklistTxHash: string | null;
  @ApiProperty({ type: String, nullable: true }) cancelSaleTxHash:
    string | null;
  @ApiProperty() isActive: boolean;
}

export class PaginatedBrandBansResponse {
  @ApiProperty({ type: BrandBanResponse, isArray: true })
  bans: BrandBanResponse[];
  @ApiProperty() total: number;
}

export const toBrandBanResponse = (entry: BrandBanEntry): BrandBanResponse => ({
  id: entry.ban.id,
  brandId: entry.ban.brandId,
  brandName: entry.brandName,
  reason: entry.ban.reason,
  bannedBy: entry.ban.bannedBy,
  bannedByUsername: entry.bannedByUsername,
  bannedAt: toIso(entry.ban.bannedAt),
  expiresAt: toIso(entry.ban.expiresAt),
  isPermanent: entry.ban.isPermanent,
  notes: entry.ban.notes,
  blacklistTxHash: entry.ban.blacklistTxHash,
  cancelSaleTxHash: entry.ban.cancelSaleTxHash,
  isActive: entry.ban.isActive(),
});
