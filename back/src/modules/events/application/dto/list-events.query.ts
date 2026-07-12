import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQuery } from '../../../../shared/application/dto/pagination.query';

export class ListEventsQuery extends PaginationQuery {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
}
