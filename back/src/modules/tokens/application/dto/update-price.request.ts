import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString } from 'class-validator';

export class UpdatePriceRequest {
  @ApiProperty({
    example: '1.50',
    description: 'Nouveau prix (décimal en chaîne)',
  })
  @IsNumberString()
  price: string;
}
