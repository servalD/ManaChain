import { randomUUID } from 'node:crypto';
import { Role } from '../../../shared/enums/role.enum';
import { User } from '../domain/user';
import {
  CreateBrandUserParams,
  CreateGoogleUserParams,
  CreateLocalUserParams,
  ListUsersParams,
  OAUTH_GOOGLE_PASSWORD_SENTINEL,
  UpdateUserFields,
  UserCredentials,
  UserRepository,
  UserWithTokenExpiry,
} from '../domain/user.repository';
import { UserNotFoundError } from '../domain/user.errors';

interface TokenEntry {
  token: string;
  expiresAt: Date | null;
}

/**
 * Fake {@link UserRepository} en mémoire pour les tests unitaires (use-cases) et
 * les overrides e2e. Aucune dépendance externe : tests rapides et déterministes.
 * Les secrets (hash, tokens) sont stockés à part, hors du modèle {@link User}.
 */
export class InMemoryUserRepository extends UserRepository {
  private readonly users = new Map<string, User>();
  private readonly passwordHashes = new Map<string, string>();
  private readonly emailVerify = new Map<string, TokenEntry>();
  private readonly passwordReset = new Map<string, TokenEntry>();
  private readonly interests = new Map<string, string[]>();
  private readonly twoFactorSecrets = new Map<string, string>();
  private readonly passwordChangedAt = new Map<string, Date>();
  private readonly passwordReminderSentAt = new Map<string, Date | null>();

  /** Helper de test : précharge un user (champs optionnels par défaut). */
  seed(
    partial: Partial<User> & {
      id?: string;
      passwordHash?: string;
      passwordChangedAt?: Date;
    } = {},
  ): User {
    const now = new Date();
    const user = new User(
      partial.id ?? randomUUID(),
      partial.email ?? `user-${randomUUID()}@example.com`,
      partial.username ?? `user_${randomUUID().slice(0, 8)}`,
      partial.firstName ?? 'First',
      partial.lastName ?? 'Last',
      partial.ageRange ?? '25-34',
      partial.avatarUrl ?? null,
      partial.blockchainAddress ?? null,
      partial.verified ?? true,
      partial.isBrand ?? false,
      partial.role ?? Role.CLIENT,
      partial.passwordChanged ?? true,
      partial.lastLogin ?? null,
      partial.createdAt ?? now,
      partial.updatedAt ?? now,
      partial.deletedAt ?? null,
      partial.twoFactorEnabled ?? false,
    );
    this.users.set(user.id, user);
    if (partial.passwordHash !== undefined) {
      this.passwordHashes.set(user.id, partial.passwordHash);
    }
    this.passwordChangedAt.set(user.id, partial.passwordChangedAt ?? now);
    return user;
  }

  // --- Profil ---

  findById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    return Promise.resolve(user && !user.deletedAt ? user : null);
  }

  list(params: ListUsersParams): Promise<{ users: User[]; total: number }> {
    let all = [...this.users.values()];
    if (params.role) {
      all = all.filter((u) => u.role === params.role);
    }
    if (params.search) {
      const s = params.search.toLowerCase();
      all = all.filter(
        (u) =>
          u.username.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s) ||
          u.firstName.toLowerCase().includes(s) ||
          u.lastName.toLowerCase().includes(s) ||
          u.id.toLowerCase().includes(s),
      );
    }
    const total = all.length;
    const users = all.slice(params.offset, params.offset + params.limit);
    return Promise.resolve({ users, total });
  }

  listIds(role?: Role): Promise<string[]> {
    let all = [...this.users.values()];
    if (role) {
      all = all.filter((u) => u.role === role);
    }
    return Promise.resolve(all.map((u) => u.id));
  }

  findByUsername(username: string): Promise<User | null> {
    const found = [...this.users.values()].find(
      (u) => u.username === username && !u.deletedAt,
    );
    return Promise.resolve(found ?? null);
  }

  findByBlockchainAddress(address: string): Promise<User | null> {
    const found = [...this.users.values()].find(
      (u) => u.blockchainAddress === address && !u.deletedAt,
    );
    return Promise.resolve(found ?? null);
  }

  updateProfile(id: string, fields: UpdateUserFields): Promise<User> {
    return Promise.resolve(
      this.cloneWith(id, {
        username: fields.username,
        firstName: fields.firstName,
        lastName: fields.lastName,
        avatarUrl: fields.avatarUrl,
        ageRange: fields.ageRange,
      }),
    );
  }

  updateBlockchainAddress(id: string, address: string): Promise<User> {
    return Promise.resolve(this.cloneWith(id, { blockchainAddress: address }));
  }

  clearBlockchainAddress(id: string): Promise<void> {
    this.cloneWith(id, { blockchainAddress: null });
    return Promise.resolve();
  }

  anonymize(id: string): Promise<void> {
    const e = this.users.get(id);
    if (!e) {
      throw new UserNotFoundError(id);
    }
    const anonymized = new User(
      e.id,
      `deleted-${id}@deleted.manachain.local`,
      `deleted-${id}`,
      'Compte',
      'supprimé',
      e.ageRange,
      null,
      null,
      false,
      false,
      e.role,
      e.passwordChanged,
      e.lastLogin,
      e.createdAt,
      new Date(),
      new Date(),
      false,
    );
    this.users.set(id, anonymized);
    this.passwordHashes.set(id, `deleted:${randomUUID()}`);
    this.emailVerify.delete(id);
    this.passwordReset.delete(id);
    this.twoFactorSecrets.delete(id);
    return Promise.resolve();
  }

  // --- Auth ---

  findByEmail(email: string): Promise<User | null> {
    const found = [...this.users.values()].find(
      (u) => u.email === email && !u.deletedAt,
    );
    return Promise.resolve(found ?? null);
  }

  findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    const user = [...this.users.values()].find(
      (u) => u.email === email && !u.deletedAt,
    );
    if (!user) return Promise.resolve(null);
    return Promise.resolve({
      user,
      passwordHash: this.passwordHashes.get(user.id) ?? '',
    });
  }

  createLocal(params: CreateLocalUserParams): Promise<User> {
    const user = this.seed({
      email: params.email,
      username: params.username,
      firstName: params.firstName,
      lastName: params.lastName,
      ageRange: params.ageRange,
      verified: params.verified ?? false,
      role: params.role ?? Role.CLIENT,
      passwordHash: params.passwordHash,
    });
    this.emailVerify.set(user.id, {
      token: params.emailVerificationToken,
      expiresAt: params.emailVerificationExpires,
    });
    return Promise.resolve(user);
  }

  createGoogle(params: CreateGoogleUserParams): Promise<User> {
    const user = this.seed({
      email: params.email,
      username: params.username,
      firstName: params.firstName,
      lastName: params.lastName,
      verified: true,
      role: Role.CLIENT,
      passwordHash: OAUTH_GOOGLE_PASSWORD_SENTINEL,
    });
    return Promise.resolve(user);
  }

  findByEmailVerificationToken(
    token: string,
  ): Promise<UserWithTokenExpiry | null> {
    return Promise.resolve(this.findByToken(this.emailVerify, token));
  }

  setEmailVerificationToken(
    id: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    this.emailVerify.set(id, { token, expiresAt });
    return Promise.resolve();
  }

  markEmailVerified(id: string): Promise<User> {
    const user = this.cloneWith(id, { verified: true });
    this.emailVerify.delete(id);
    return Promise.resolve(user);
  }

  findByPasswordResetToken(token: string): Promise<UserWithTokenExpiry | null> {
    return Promise.resolve(this.findByToken(this.passwordReset, token));
  }

  setPasswordResetToken(
    id: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    this.passwordReset.set(id, { token, expiresAt });
    return Promise.resolve();
  }

  updatePassword(id: string, passwordHash: string): Promise<User> {
    if (!this.users.has(id)) {
      throw new UserNotFoundError(id);
    }
    this.passwordHashes.set(id, passwordHash);
    this.passwordReset.delete(id);
    this.passwordChangedAt.set(id, new Date());
    this.passwordReminderSentAt.set(id, null);
    return Promise.resolve(this.cloneWith(id, { passwordChanged: true }));
  }

  listUsersWithExpiredPassword(
    cutoff: Date,
  ): Promise<{ id: string; email: string; username: string }[]> {
    const due = [...this.users.values()].filter((u) => {
      if (u.deletedAt) return false;
      if (this.passwordHashes.get(u.id) === OAUTH_GOOGLE_PASSWORD_SENTINEL) {
        return false;
      }
      const changedAt = this.passwordChangedAt.get(u.id);
      if (!changedAt || changedAt > cutoff) return false;
      const reminderAt = this.passwordReminderSentAt.get(u.id);
      return !reminderAt || reminderAt <= cutoff;
    });
    return Promise.resolve(
      due.map((u) => ({ id: u.id, email: u.email, username: u.username })),
    );
  }

  markPasswordReminderSent(id: string): Promise<void> {
    this.passwordReminderSentAt.set(id, new Date());
    return Promise.resolve();
  }

  // --- Brands ---

  setBrandFlag(): Promise<void> {
    // Le flag is_brand n'est pas modélisé dans le fake (non pertinent pour les tests).
    return Promise.resolve();
  }

  createBrandUser(params: CreateBrandUserParams): Promise<User> {
    const user = this.seed({
      email: params.email,
      username: params.username,
      firstName: params.firstName,
      lastName: params.lastName,
      verified: true,
      isBrand: true,
      role: Role.BRANDUSER,
      passwordChanged: false,
      passwordHash: params.passwordHash,
    });
    return Promise.resolve(user);
  }

  findAdminEmails(): Promise<string[]> {
    return Promise.resolve(
      [...this.users.values()]
        .filter((u) => u.role === Role.ADMIN)
        .map((u) => u.email),
    );
  }

  // --- Interests ---

  getInterestIds(userId: string): Promise<string[]> {
    return Promise.resolve(this.interests.get(userId) ?? []);
  }

  setInterestIds(userId: string, interestIds: string[]): Promise<void> {
    this.interests.set(userId, [...interestIds]);
    return Promise.resolve();
  }

  // --- 2FA TOTP ---

  getTwoFactorSecret(userId: string): Promise<string | null> {
    return Promise.resolve(this.twoFactorSecrets.get(userId) ?? null);
  }

  setTwoFactorSecret(userId: string, encryptedSecret: string): Promise<void> {
    this.twoFactorSecrets.set(userId, encryptedSecret);
    return Promise.resolve();
  }

  enableTwoFactor(userId: string): Promise<void> {
    this.cloneWith(userId, { twoFactorEnabled: true });
    return Promise.resolve();
  }

  disableTwoFactor(userId: string): Promise<void> {
    this.cloneWith(userId, { twoFactorEnabled: false });
    this.twoFactorSecrets.delete(userId);
    return Promise.resolve();
  }

  // --- Helpers ---

  private findByToken(
    store: Map<string, TokenEntry>,
    token: string,
  ): UserWithTokenExpiry | null {
    for (const [userId, entry] of store.entries()) {
      if (entry.token === token) {
        const user = this.users.get(userId);
        if (user) return { user, expiresAt: entry.expiresAt };
      }
    }
    return null;
  }

  private cloneWith(
    id: string,
    changes: Partial<
      Pick<
        User,
        | 'username'
        | 'firstName'
        | 'lastName'
        | 'avatarUrl'
        | 'blockchainAddress'
        | 'verified'
        | 'passwordChanged'
        | 'ageRange'
        | 'twoFactorEnabled'
      >
    >,
  ): User {
    const e = this.users.get(id);
    if (!e) {
      throw new UserNotFoundError(id);
    }
    const updated = new User(
      e.id,
      e.email,
      changes.username ?? e.username,
      changes.firstName ?? e.firstName,
      changes.lastName ?? e.lastName,
      changes.ageRange ?? e.ageRange,
      changes.avatarUrl !== undefined ? changes.avatarUrl : e.avatarUrl,
      changes.blockchainAddress !== undefined
        ? changes.blockchainAddress
        : e.blockchainAddress,
      changes.verified ?? e.verified,
      e.isBrand,
      e.role,
      changes.passwordChanged ?? e.passwordChanged,
      e.lastLogin,
      e.createdAt,
      new Date(),
      undefined,
      changes.twoFactorEnabled ?? e.twoFactorEnabled,
    );
    this.users.set(id, updated);
    return updated;
  }
}
