import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AGE_RANGES } from '../../../users/domain/age-ranges';
import { IsStrongPassword } from './password.rules';

export class RegisterRequest {
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'ada_l' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({ example: 'Ada' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Lovelace' })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsStrongPassword()
  password: string;

  @ApiProperty({ enum: AGE_RANGES, example: '25-34' })
  @IsIn(AGE_RANGES)
  ageRange: string;

  @ApiPropertyOptional({ type: [String], example: ['tech', 'music'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}
