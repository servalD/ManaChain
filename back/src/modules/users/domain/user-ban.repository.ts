import { UserBan } from './user-ban';

export interface CreateUserBanParams {
  userId: string;
  reason: string;
  bannedBy: string;
  expiresAt?: Date | null;
  isPermanent: boolean;
  notes?: string | null;
}

export interface ListUserBansParams {
  limit: number;
  offset: number;
}

/**
 * Repository PORT (écriture) de la table `user_ban`. Distinct de la lecture
 * seule utilisée par le login/guard (voir {@link UserRepository.listIds} pour
 * le fan-out) : `findActive` est réutilisé par l'auth (jalon de connexion)
 * pour bloquer un compte banni sans passer par un module dédié.
 */
export abstract class UserBanRepository {
  abstract create(params: CreateUserBanParams): Promise<UserBan>;
  /** Ban actif le plus récent pour cet utilisateur, ou `null`. */
  abstract findActive(userId: string): Promise<UserBan | null>;
  /** Lève un ban : le rend non-permanent avec `expires_at = NOW()` (garde l'historique). */
  abstract revoke(userId: string): Promise<void>;
  abstract list(
    params: ListUserBansParams,
  ): Promise<{ bans: UserBan[]; total: number }>;
  /** Sous-ensemble de `userIds` ayant un ban actif (permanent ou non expiré). */
  abstract findActivelyBannedIds(userIds: string[]): Promise<string[]>;
}
