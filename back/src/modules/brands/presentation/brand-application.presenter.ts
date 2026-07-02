import { ApiProperty } from '@nestjs/swagger';
import { BrandApplication } from '../domain/brand-application';

export class BrandApplicationResponse {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() contactEmail: string;
  @ApiProperty() contactFirstName: string;
  @ApiProperty() contactLastName: string;
  @ApiProperty() brandName: string;
  @ApiProperty({ type: String, nullable: true }) description: string | null;
  @ApiProperty({ type: String, nullable: true }) websiteUrl: string | null;
  @ApiProperty({ type: String, nullable: true }) logoUrl: string | null;
  @ApiProperty() businessRegistrationNumber: string;
  @ApiProperty() country: string;
  @ApiProperty() status: string;
  @ApiProperty() emailVerified: boolean;
  @ApiProperty({ type: String, nullable: true }) rejectionReason: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt: string;
}

export class PaginatedApplicationsResponse {
  @ApiProperty({ type: BrandApplicationResponse, isArray: true })
  applications: BrandApplicationResponse[];
  @ApiProperty() total: number;
}

export const toApplicationResponse = (
  a: BrandApplication,
): BrandApplicationResponse => ({
  id: a.id,
  contactEmail: a.contactEmail,
  contactFirstName: a.contactFirstName,
  contactLastName: a.contactLastName,
  brandName: a.brandName,
  description: a.description,
  websiteUrl: a.websiteUrl,
  logoUrl: a.logoUrl,
  businessRegistrationNumber: a.businessRegistrationNumber,
  country: a.country,
  status: a.status,
  emailVerified: a.emailVerified,
  rejectionReason: a.rejectionReason,
  createdAt: a.createdAt.toISOString(),
});
