import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class OAuthExchangeRequest {
  @ApiProperty({
    description: 'Ticket renvoyé par la redirection /auth/google/callback',
  })
  @IsString()
  @IsNotEmpty()
  ticket: string;
}
