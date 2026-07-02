import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../shared/enums/role.enum';
import { User } from '../domain/user';

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
  createdAt: user.createdAt.toISOString(),
});
