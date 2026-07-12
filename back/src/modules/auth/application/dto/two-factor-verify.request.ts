import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TwoFactorVerifyRequest {
  @ApiProperty({
    description: 'Challenge renvoyé par /auth/login ou /auth/google/callback',
  })
  @IsString()
  @IsNotEmpty()
  challengeToken: string;

  @ApiProperty({
    example: '123456',
    description: 'Code TOTP à 6 chiffres, ou un code de récupération',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
