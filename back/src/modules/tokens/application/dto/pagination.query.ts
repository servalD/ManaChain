import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationQuery } from '../../../../shared/application/dto/pagination.query';

// Default 50 (contrat API historique du module tokens), contre 20 partout ailleurs.
export class TokensPaginationQuery extends PaginationQuery {
  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;
}
