import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { Role } from '../../../../shared/enums/role.enum';

export type NotificationRecipientType = 'user' | 'role' | 'all';

export class SendNotificationRequest {
  @ApiProperty({
    enum: ['user', 'role', 'all'],
    description:
      'Destinataire unique (userId), tous les utilisateurs d’un rôle, ou tout le monde',
  })
  @IsEnum(['user', 'role', 'all'])
  recipientType: NotificationRecipientType;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Requis si recipientType = "user"',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    enum: Role,
    description: 'Requis si recipientType = "role"',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ example: 'Maintenance planifiée' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({
    example: 'La plateforme sera indisponible demain de 2h à 4h.',
  })
  @IsString()
  @MinLength(3)
  body: string;
}
