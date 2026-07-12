import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQuery } from '../../../../shared/application/dto/pagination.query';
import type { BrandApplicationStatus } from '../../domain/brand-application';

const STATUSES: BrandApplicationStatus[] = [
  'pending',
  'approved',
  'rejected',
  'needs_review',
];

export class ListApplicationsQuery extends PaginationQuery {
  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsIn(STATUSES)
  status?: BrandApplicationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
