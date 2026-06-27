import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

/** DTO partagé par resend-verification et forgot-password. */
export class EmailRequest {
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  email: string;
}
