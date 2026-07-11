import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutRequest {
  @ApiProperty({ description: 'Refresh token à révoquer' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
