import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { PaginationQuery } from '../../../../shared/application/dto/pagination.query';

export class ListBrandsQuery extends PaginationQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrer par centre d’intérêt' })
  @IsOptional()
  @IsString()
  interestId?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'IDs de marques à exclure (ex : déjà likées)',
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value ? [value] : undefined,
  )
  @IsArray()
  @IsString({ each: true })
  excludeBrandIds?: string[];
}
