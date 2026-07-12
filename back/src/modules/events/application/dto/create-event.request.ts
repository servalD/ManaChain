import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateEventRequest {
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() type: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() addressStreet?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() addressCity?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() addressZipCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() addressCountry?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() addressComplement?: string;
  @ApiProperty({ format: 'date-time' }) @IsDateString() startsAt: string;
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) maxTickets?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minTokenBalance?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() coverImageUrl?: string;
}
