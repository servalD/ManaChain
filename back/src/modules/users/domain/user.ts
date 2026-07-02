import { Role } from '../../../shared/enums/role.enum';

/**
 * Modèle de domaine PUR — aucun import framework / ORM ici. La persistance est
 * gérée par un adapter dans la couche infrastructure (mapping `toDomain`).
 *
 * Les secrets (`password_hash`, jetons de vérification/reset) ne font PAS partie
 * du modèle : ils restent confinés à la couche infra / au module `auth`.
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly username: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly ageRange: string,
    public readonly avatarUrl: string | null,
    public readonly blockchainAddress: string | null,
    public readonly verified: boolean,
    public readonly isBrand: boolean,
    public readonly role: Role,
    public readonly passwordChanged: boolean,
    public readonly lastLogin: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  hasRole(role: Role): boolean {
    return this.role === role;
  }

  isAdmin(): boolean {
    return this.role === Role.ADMIN;
  }
}
