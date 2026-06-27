import { randomUUID } from 'node:crypto';
import { Role } from '../../../shared/enums/role.enum';
import { User } from '../domain/user';
import { UpdateUserFields, UserRepository } from '../domain/user.repository';
import { UserNotFoundError } from '../domain/user.errors';

/**
 * Fake {@link UserRepository} en mémoire pour les tests unitaires (use-cases) et
 * les overrides e2e. Aucune dépendance externe : tests rapides et déterministes.
 */
export class InMemoryUserRepository extends UserRepository {
  private readonly users = new Map<string, User>();

  /** Helper de test : précharge un user (champs optionnels par défaut). */
  seed(partial: Partial<User> & { id?: string } = {}): User {
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
      partial.lastLogin ?? null,
      partial.createdAt ?? now,
      partial.updatedAt ?? now,
    );
    this.users.set(user.id, user);
    return user;
  }

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.get(id) ?? null);
  }

  findAll(): Promise<User[]> {
    return Promise.resolve([...this.users.values()]);
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
    const existing = this.users.get(id);
    if (!existing) {
      throw new UserNotFoundError(id);
    }
    const updated = new User(
      existing.id,
      existing.email,
      fields.username ?? existing.username,
      fields.firstName ?? existing.firstName,
      fields.lastName ?? existing.lastName,
      existing.ageRange,
      fields.avatarUrl !== undefined ? fields.avatarUrl : existing.avatarUrl,
      existing.blockchainAddress,
      existing.verified,
      existing.isBrand,
      existing.role,
      existing.lastLogin,
      existing.createdAt,
      new Date(),
    );
    this.users.set(id, updated);
    return Promise.resolve(updated);
  }

  updateBlockchainAddress(id: string, address: string): Promise<User> {
    const existing = this.users.get(id);
    if (!existing) {
      throw new UserNotFoundError(id);
    }
    const updated = new User(
      existing.id,
      existing.email,
      existing.username,
      existing.firstName,
      existing.lastName,
      existing.ageRange,
      existing.avatarUrl,
      address,
      existing.verified,
      existing.isBrand,
      existing.role,
      existing.lastLogin,
      existing.createdAt,
      new Date(),
    );
    this.users.set(id, updated);
    return Promise.resolve(updated);
  }
}
