import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsISO8601,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class BanUserRequest {
  @ApiProperty({
    example: 'Repeated abusive behaviour reported by multiple brands',
  })
  @IsString()
  @MinLength(3)
  reason: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  isPermanent: boolean;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Requis si isPermanent = false',
  })
  @ValidateIf((o: BanUserRequest) => !o.isPermanent)
  @IsISO8601()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
