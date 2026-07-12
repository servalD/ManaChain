import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, Matches } from 'class-validator';

export class LinkEventContractsRequest {
  @ApiProperty() @Matches(/^0x[a-fA-F0-9]{40}$/) eventTicketsAddress: string;
  @ApiProperty() @IsBoolean() paymentFree: boolean;
}
