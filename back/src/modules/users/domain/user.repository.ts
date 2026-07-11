import { Role } from '../../../shared/enums/role.enum';
import { User } from './user';

/**
 * Sentinelle stockée dans `user.password_hash` pour les comptes Google (qui n'ont
 * pas de mot de passe). Conservée pour rester compatible avec les données Express.
 */
export const OAUTH_GOOGLE_PASSWORD_SENTINEL = 'oauth:google';

/** Champs de profil modifiables via `PUT /users/me`. */
export interface UpdateUserFields {
  firstName?: string;
  lastName?: string;
  username?: string;
  avatarUrl?: string | null;
  ageRange?: string;
}

/**
 * Identifiants d'un compte local. `passwordHash` est volontairement gardé HORS
 * du modèle {@link User} et ne ressort qu'ici, pour la vérification au login.
 * La sentinelle `oauth:google` y apparaît pour les comptes Google (pas de mot de passe).
 */
export interface UserCredentials {
  user: User;
  passwordHash: string;
}

/** Données nécessaires à la création d'un compte local (register). */
export interface CreateLocalUserParams {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  ageRange: string;
  emailVerificationToken: string;
  emailVerificationExpires: Date;
  interests?: string[];
}

/** Données nécessaires au provisionnement d'un compte depuis Google OAuth. */
export interface CreateGoogleUserParams {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
}

/**
 * Données pour créer un compte BRANDUSER à l'approbation d'une candidature :
 * pré-vérifié, `is_brand=true`, `password_changed=false` (changement forcé au
 * 1er login).
 */
export interface CreateBrandUserParams {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
}

/** Filtres de la liste admin des utilisateurs. */
export interface ListUsersParams {
  limit: number;
  offset: number;
  search?: string;
  role?: Role;
}

/** Résultat d'une recherche par token (vérif email / reset), avec l'expiration. */
export interface UserWithTokenExpiry {
  user: User;
  expiresAt: Date | null;
}

/**
 * Repository PORT (hexagonal). Utilisé comme token DI ; l'adapter TypeORM vit
 * dans la couche infrastructure et est lié dans {@link UsersModule}. Un fake
 * in-memory ({@link InMemoryUserRepository}) sert aux tests.
 */
export abstract class UserRepository {
  // --- Profil (jalon 1) ---
  abstract findById(id: string): Promise<User | null>;
  /** Liste paginée pour l'admin (recherche username/email/prénom/nom, filtre rôle). */
  abstract list(
    params: ListUsersParams,
  ): Promise<{ users: User[]; total: number }>;
  /** Tous les ids d'utilisateurs (filtrés par rôle si fourni) — fan-out notifications. */
  abstract listIds(role?: Role): Promise<string[]>;
  abstract findByUsername(username: string): Promise<User | null>;
  abstract findByBlockchainAddress(address: string): Promise<User | null>;
  abstract updateProfile(id: string, fields: UpdateUserFields): Promise<User>;
  abstract updateBlockchainAddress(id: string, address: string): Promise<User>;
  /** RGPD (D9) : efface le lien blockchain de l'utilisateur (suppression de compte). */
  abstract clearBlockchainAddress(id: string): Promise<void>;
  /**
   * RGPD : anonymise le compte en place (email/username/nom/mot de passe
   * remplacés par des valeurs non identifiantes, `deleted_at` renseigné).
   * N'efface PAS la ligne — évite les CASCADE/RESTRICT sur `brand`/`*_ban`.
   * Les lookups (`findById`, `findByEmail`, ...) excluent ensuite ce compte.
   */
  abstract anonymize(id: string): Promise<void>;

  // --- Auth (jalon 2) ---
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findCredentialsByEmail(
    email: string,
  ): Promise<UserCredentials | null>;
  abstract createLocal(params: CreateLocalUserParams): Promise<User>;
  abstract createGoogle(params: CreateGoogleUserParams): Promise<User>;

  abstract findByEmailVerificationToken(
    token: string,
  ): Promise<UserWithTokenExpiry | null>;
  abstract setEmailVerificationToken(
    id: string,
    token: string,
    expiresAt: Date,
  ): Promise<void>;
  abstract markEmailVerified(id: string): Promise<User>;

  abstract findByPasswordResetToken(
    token: string,
  ): Promise<UserWithTokenExpiry | null>;
  abstract setPasswordResetToken(
    id: string,
    token: string,
    expiresAt: Date,
  ): Promise<void>;
  /** Remplace le hash, force `password_changed=true` et purge le token de reset. */
  abstract updatePassword(id: string, passwordHash: string): Promise<User>;

  // --- Brands (jalon 3) ---
  /** Positionne le flag `is_brand` (création/suppression d'une marque). */
  abstract setBrandFlag(id: string, isBrand: boolean): Promise<void>;
  /** Crée le compte BRANDUSER lié à une candidature approuvée. */
  abstract createBrandUser(params: CreateBrandUserParams): Promise<User>;
  /** Emails de tous les utilisateurs ADMIN (notification de candidature). */
  abstract findAdminEmails(): Promise<string[]>;

  // --- Interests ---
  abstract getInterestIds(userId: string): Promise<string[]>;
  /** Remplace intégralement les centres d'intérêt de l'utilisateur. */
  abstract setInterestIds(userId: string, interestIds: string[]): Promise<void>;

  // --- 2FA TOTP ---
  /** Secret TOTP chiffré (cf. `TwoFactorSecretCipher`), ou `null` si jamais configuré. */
  abstract getTwoFactorSecret(userId: string): Promise<string | null>;
  /** Étape "setup" : enregistre le secret chiffré, `two_factor_enabled` reste `false`. */
  abstract setTwoFactorSecret(
    userId: string,
    encryptedSecret: string,
  ): Promise<void>;
  /** Étape "enable" : active le 2FA (le secret a déjà été vérifié par le use-case). */
  abstract enableTwoFactor(userId: string): Promise<void>;
  /** Désactive le 2FA et efface le secret. */
  abstract disableTwoFactor(userId: string): Promise<void>;
}
