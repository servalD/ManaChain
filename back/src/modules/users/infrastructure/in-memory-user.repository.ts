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

  /** Helper de test : précharge un user (champs optionnels par défaut). */
  seed(
    partial: Partial<User> & { id?: string; passwordHash?: string } = {},
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
    );
    this.users.set(user.id, user);
    if (partial.passwordHash !== undefined) {
      this.passwordHashes.set(user.id, partial.passwordHash);
    }
    return user;
  }

  // --- Profil ---

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.get(id) ?? null);
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

  findByUsername(username: string): Promise<User | null> {
    const found = [...this.users.values()].find((u) => u.username === username);
    return Promise.resolve(found ?? null);
  }

  findByBlockchainAddress(address: string): Promise<User | null> {
    const found = [...this.users.values()].find(
      (u) => u.blockchainAddress === address,
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

  // --- Auth ---

  findByEmail(email: string): Promise<User | null> {
    const found = [...this.users.values()].find((u) => u.email === email);
    return Promise.resolve(found ?? null);
  }

  findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    const user = [...this.users.values()].find((u) => u.email === email);
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
      verified: false,
      role: Role.CLIENT,
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
    return Promise.resolve(this.cloneWith(id, { passwordChanged: true }));
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
    );
    this.users.set(id, updated);
    return updated;
  }
}
