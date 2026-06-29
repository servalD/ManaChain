import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBrandApplicationRequest {
  // Contact
  @ApiProperty()
  @IsEmail()
  contactEmail: string;

  @ApiProperty()
  @IsString()
  contactFirstName: string;

  @ApiProperty()
  @IsString()
  contactLastName: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  contactPhone?: string | null;

  // Brand
  @ApiProperty()
  @IsString()
  brandName: string;

  @ApiProperty({ type: [String], description: '1 à 2 centres d’intérêt' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @IsString({ each: true })
  interestIds: string[];

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  websiteUrl?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  // Legal
  @ApiProperty()
  @IsString()
  businessRegistrationNumber: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty()
  @IsString()
  headquartersStreet: string;

  @ApiProperty()
  @IsString()
  headquartersCity: string;

  @ApiProperty()
  @IsString()
  headquartersZipCode: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  headquartersAddressComplement?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  registrationProofUrl?: string | null;

  // Additional
  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  motivation?: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedCommunitySize?: number | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  @IsOptional()
  @IsObject()
  socialMediaLinks?: Record<string, string> | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  howDidYouHearAboutUs?: string | null;
}
