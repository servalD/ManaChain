import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

/**
 * Règles de mot de passe — backlog sécu CNIL : ≥ 12 caractères (recommandation
 * CNIL pour une authentification par mot de passe seul, sans second facteur
 * obligatoire), ≥ 1 chiffre, ≥ 1 caractère spécial. Réutilisable sur tout DTO.
 */
export const IsStrongPassword = () =>
  applyDecorators(
    ApiProperty({ example: 'S3cret!pwd-strong', minLength: 12 }),
    IsString(),
    MinLength(12, { message: 'Password must be at least 12 characters long' }),
    Matches(/\d/, { message: 'Password must contain at least one digit' }),
    Matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, {
      message: 'Password must contain at least one special character',
    }),
  );
