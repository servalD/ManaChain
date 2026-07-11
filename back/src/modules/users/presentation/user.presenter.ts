import { ApiProperty } from '@nestjs/swagger';
import { toIso } from '../../../shared/presentation/date';
import { Role } from '../../../shared/enums/role.enum';
import { User } from '../domain/user';
import { UserBanEntry } from '../application/use-cases/list-user-bans.use-case';

export class UserResponse {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'ada_l' })
  username: string;

  @ApiProperty({ example: 'Ada' })
  firstName: string;

  @ApiProperty({ example: 'Lovelace' })
  lastName: string;

  @ApiProperty({ example: '25-34' })
  ageRange: string;

  @ApiProperty({ type: String, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ type: String, nullable: true })
  blockchainAddress: string | null;

  @ApiProperty()
  verified: boolean;

  @ApiProperty()
  isBrand: boolean;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({
    description:
      'False tant qu’un compte marque créé avec un mot de passe temporaire ne l’a pas changé.',
  })
  passwordChanged: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({
    description: 'Authentification à deux facteurs (TOTP) active.',
  })
  twoFactorEnabled: boolean;
}

export class PaginatedUsersResponse {
  @ApiProperty({ type: UserResponse, isArray: true }) users: UserResponse[];
  @ApiProperty() total: number;
}

/** Mappe un {@link User} de domaine vers la forme publique de l'API. */
export const toUserResponse = (user: User): UserResponse => ({
  id: user.id,
  email: user.email,
  username: user.username,
  firstName: user.firstName,
  lastName: user.lastName,
  ageRange: user.ageRange,
  avatarUrl: user.avatarUrl,
  blockchainAddress: user.blockchainAddress,
  verified: user.verified,
  isBrand: user.isBrand,
  role: user.role,
  passwordChanged: user.passwordChanged,
  createdAt: toIso(user.createdAt),
  twoFactorEnabled: user.twoFactorEnabled,
});

export class UserBanResponse {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ type: String, nullable: true })
  username: string | null;

  @ApiProperty()
  reason: string;

  @ApiProperty({ format: 'uuid' })
  bannedBy: string;

  @ApiProperty({ type: String, nullable: true })
  bannedByUsername: string | null;

  @ApiProperty({ format: 'date-time' })
  bannedAt: string;

  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  expiresAt: string | null;

  @ApiProperty()
  isPermanent: boolean;

  @ApiProperty({ type: String, nullable: true })
  notes: string | null;

  @ApiProperty()
  isActive: boolean;
}

export class PaginatedUserBansResponse {
  @ApiProperty({ type: UserBanResponse, isArray: true })
  bans: UserBanResponse[];
  @ApiProperty() total: number;
}

export const toUserBanResponse = (entry: UserBanEntry): UserBanResponse => ({
  id: entry.ban.id,
  userId: entry.ban.userId,
  username: entry.username,
  reason: entry.ban.reason,
  bannedBy: entry.ban.bannedBy,
  bannedByUsername: entry.bannedByUsername,
  bannedAt: toIso(entry.ban.bannedAt),
  expiresAt: toIso(entry.ban.expiresAt),
  isPermanent: entry.ban.isPermanent,
  notes: entry.ban.notes,
  isActive: entry.ban.isActive(),
});
