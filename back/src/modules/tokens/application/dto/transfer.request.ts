import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class TransferRequest {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  toUserId: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  amount: number;
}
