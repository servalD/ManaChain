import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';

/**
 * Restreint une route aux utilisateurs ayant l'un des rôles donnés. Appliqué
 * par le {@link RolesGuard} global, qui lit le rôle du user rechargé en base.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
