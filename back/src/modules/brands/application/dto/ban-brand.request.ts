import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsISO8601,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class BanBrandRequest {
  @ApiProperty({ example: 'Repeated fraudulent token sale complaints' })
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
  @ValidateIf((o: BanBrandRequest) => !o.isPermanent)
  @IsISO8601()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Hash de la tx manaAdmin.setBrandBlacklisted, si déjà passée',
  })
  @IsOptional()
  @IsString()
  blacklistTxHash?: string;

  @ApiPropertyOptional({
    description:
      'Hash de la tx manaAdmin.cancelTokenSale, si une vente était ouverte',
  })
  @IsOptional()
  @IsString()
  cancelSaleTxHash?: string;
}
