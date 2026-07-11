import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshRequest {
  @ApiProperty({ description: 'Refresh token émis par /auth/login ou /auth/refresh' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
