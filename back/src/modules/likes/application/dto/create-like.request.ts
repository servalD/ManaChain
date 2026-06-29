import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateLikeRequest {
  @ApiProperty({
    format: 'uuid',
    description: 'Identifiant de la marque à aimer',
  })
  @IsUUID()
  brandId: string;
}
