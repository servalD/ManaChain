/**
 * Rôles applicatifs. Valeurs alignées sur la colonne `user.role` de la base
 * existante (contrainte CHECK : ADMIN | CLIENT | BRANDUSER).
 */
export enum Role {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  BRANDUSER = 'BRANDUSER',
}
