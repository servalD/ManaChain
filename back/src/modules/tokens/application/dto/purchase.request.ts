import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumberString, Min } from 'class-validator';

export class PurchaseRequest {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({
    example: '1.50',
    description: 'Prix unitaire (décimal en chaîne)',
  })
  @IsNumberString()
  pricePerToken: string;
}
