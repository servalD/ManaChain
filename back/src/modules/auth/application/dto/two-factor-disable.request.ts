import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TwoFactorDisableRequest {
  @ApiProperty({ example: 'S3cret!pwd' })
  @IsString()
  password: string;
}
