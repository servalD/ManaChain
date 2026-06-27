import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { IsStrongPassword } from './password.rules';

export class ResetPasswordRequest {
  @ApiProperty({ description: 'Token de reset reçu par email' })
  @IsString()
  token: string;

  @IsStrongPassword()
  newPassword: string;
}
