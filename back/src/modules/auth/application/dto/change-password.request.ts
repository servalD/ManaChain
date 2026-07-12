import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from './password.rules';

export class ChangePasswordRequest {
  @ApiProperty({
    description: 'Mot de passe courant, requis pour confirmer l’identité',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty()
  @IsStrongPassword()
  newPassword: string;
}
