import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';

/** Fenêtre pour les endpoints d'agrégation temporelle (charts dashboard). */
export class HistoryRangeQuery {
  @ApiPropertyOptional({ default: 30, enum: [7, 30, 90] })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsIn([7, 30, 90])
  days: number = 30;
}
