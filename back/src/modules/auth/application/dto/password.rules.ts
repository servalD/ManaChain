import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

/**
 * Règles de mot de passe portées de `server/utils/validation.ts` :
 * ≥ 8 caractères, ≥ 1 chiffre, ≥ 1 caractère spécial. Réutilisable sur tout DTO.
 */
export const IsStrongPassword = () =>
  applyDecorators(
    ApiProperty({ example: 'S3cret!pwd', minLength: 8 }),
    IsString(),
    MinLength(8, { message: 'Password must be at least 8 characters long' }),
    Matches(/\d/, { message: 'Password must contain at least one digit' }),
    Matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, {
      message: 'Password must contain at least one special character',
    }),
  );
