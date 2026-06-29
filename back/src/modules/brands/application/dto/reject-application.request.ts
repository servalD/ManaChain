import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RejectApplicationRequest {
  @ApiProperty({ description: 'Motif du rejet (communiqué au contact)' })
  @IsString()
  @MinLength(3)
  rejectionReason: string;
}
