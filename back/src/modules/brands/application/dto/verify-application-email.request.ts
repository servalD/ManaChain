import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyApplicationEmailRequest {
  @ApiProperty({ description: 'Token de vérification reçu par email' })
  @IsString()
  token: string;
}
