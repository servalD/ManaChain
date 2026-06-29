import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
  Min,
  IsInt,
  MaxLength,
} from 'class-validator';

export class CreateTokenRequest {
  @ApiProperty({ example: 'MANA' })
  @IsString()
  @Matches(/^[A-Za-z0-9]{2,10}$/, {
    message: 'symbol must be 2-10 alphanumeric characters',
  })
  symbol: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalSupply?: number;

  @ApiPropertyOptional({ default: '0', description: 'Prix décimal en chaîne' })
  @IsOptional()
  @IsNumberString()
  currentPrice?: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nftTokenId?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  nftName?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  nftSymbol?: string | null;
}
