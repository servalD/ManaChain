import { createHash, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { IsNull, Repository } from 'typeorm';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
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
import { UserOrmEntity } from './user.orm-entity';

/**
 * Adapter TypeORM implémentant le port {@link UserRepository}. Ne laisse jamais
 * fuiter l'ORM entity : tout sort en {@link User} de domaine via `toDomain`.
 */
@Injectable()
export class TypeOrmUserRepository extends UserRepository {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  private get repository(): Repository<UserOrmEntity> {
    return this.db.getRepository(UserOrmEntity);
  }

  // --- Profil ---

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async list(
    params: ListUsersParams,
  ): Promise<{ users: User[]; total: number }> {
    const qb = this.repository.createQueryBuilder('u');
    if (params.search) {
      qb.andWhere(
        `(u.username ILIKE :s OR u.email ILIKE :s
          OR u.first_name ILIKE :s OR u.last_name ILIKE :s
          OR u.id::text ILIKE :s)`,
        { s: `%${params.search}%` },
      );
    }
    if (params.role) {
      qb.andWhere('u.role = :role', { role: params.role });
    }
    qb.orderBy('u.created_at', 'DESC').skip(params.offset).take(params.limit);

    const [entities, total] = await qb.getManyAndCount();
    return { users: entities.map((entity) => this.toDomain(entity)), total };
  }

  async listIds(role?: Role): Promise<string[]> {
    const qb = this.repository.createQueryBuilder('u').select('u.id');
    if (role) {
      qb.where('u.role = :role', { role });
    }
    const entities = await qb.getMany();
    return entities.map((e) => e.id);
  }

  async findByUsername(username: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { username, deletedAt: IsNull() },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByBlockchainAddress(address: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { blockchainAddress: address, deletedAt: IsNull() },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async updateProfile(id: string, fields: UpdateUserFields): Promise<User> {
    await this.repository.update({ id }, fields);
    return this.getOrThrow(id);
  }

  async updateBlockchainAddress(id: string, address: string): Promise<User> {
    await this.repository.update({ id }, { blockchainAddress: address });
    return this.getOrThrow(id);
  }

  async clearBlockchainAddress(id: string): Promise<void> {
    await this.repository.update({ id }, { blockchainAddress: null });
  }

  async anonymize(id: string): Promise<void> {
    await this.repository.update(
      { id },
      {
        email: `deleted-${id}@deleted.manachain.local`,
        username: `deleted-${id}`,
        firstName: 'Compte',
        lastName: 'supprimé',
        passwordHash: `deleted:${randomUUID()}`,
        avatarUrl: null,
        blockchainAddress: null,
        verified: false,
        isBrand: false,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        deletedAt: new Date(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    );
  }

  // --- Auth ---

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { email, deletedAt: IsNull() },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    // passwordHash est `select: false` → addSelect explicite pour le login.
    const entity = await this.repository
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email AND u.deletedAt IS NULL', { email })
      .getOne();
    if (!entity) return null;
    return { user: this.toDomain(entity), passwordHash: entity.passwordHash };
  }

  async createLocal(params: CreateLocalUserParams): Promise<User> {
    const created = this.repository.create({
      email: params.email,
      username: params.username,
      firstName: params.firstName,
      lastName: params.lastName,
      passwordHash: params.passwordHash,
      ageRange: params.ageRange,
      verified: params.verified ?? false,
      isBrand: false,
      role: params.role ?? Role.CLIENT,
      passwordChanged: true,
      emailVerificationToken: this.hash(params.emailVerificationToken),
      emailVerificationExpires: params.emailVerificationExpires,
    });
    const saved = await this.repository.save(created);
    await this.linkInterests(saved.id, params.interests);
    return this.toDomain(saved);
  }

  async createGoogle(params: CreateGoogleUserParams): Promise<User> {
    const created = this.repository.create({
      email: params.email,
      username: params.username,
      firstName: params.firstName,
      lastName: params.lastName,
      passwordHash: OAUTH_GOOGLE_PASSWORD_SENTINEL,
      ageRange: '25-34',
      verified: true,
      isBrand: false,
      role: Role.CLIENT,
      passwordChanged: true,
    });
    const saved = await this.repository.save(created);
    return this.toDomain(saved);
  }

  async findByEmailVerificationToken(
    token: string,
  ): Promise<UserWithTokenExpiry | null> {
    const entity = await this.repository.findOne({
      where: { emailVerificationToken: this.hash(token) },
    });
    if (!entity) return null;
    return {
      user: this.toDomain(entity),
      expiresAt: entity.emailVerificationExpires,
    };
  }

  async setEmailVerificationToken(
    id: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.repository.update(
      { id },
      {
        emailVerificationToken: this.hash(token),
        emailVerificationExpires: expiresAt,
      },
    );
  }

  async markEmailVerified(id: string): Promise<User> {
    await this.repository.update(
      { id },
      {
        verified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    );
    return this.getOrThrow(id);
  }

  async findByPasswordResetToken(
    token: string,
  ): Promise<UserWithTokenExpiry | null> {
    const entity = await this.repository.findOne({
      where: { passwordResetToken: this.hash(token) },
    });
    if (!entity) return null;
    return {
      user: this.toDomain(entity),
      expiresAt: entity.passwordResetExpires,
    };
  }

  async setPasswordResetToken(
    id: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.repository.update(
      { id },
      {
        passwordResetToken: this.hash(token),
        passwordResetExpires: expiresAt,
      },
    );
  }

  async updatePassword(id: string, passwordHash: string): Promise<User> {
    await this.repository.update(
      { id },
      {
        passwordHash,
        passwordChanged: true,
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordChangedAt: new Date(),
        passwordReminderSentAt: null,
      },
    );
    return this.getOrThrow(id);
  }

  async listUsersWithExpiredPassword(
    cutoff: Date,
  ): Promise<{ id: string; email: string; username: string }[]> {
    const entities = await this.repository
      .createQueryBuilder('u')
      .select(['u.id', 'u.email', 'u.username'])
      .where('u.deletedAt IS NULL')
      .andWhere('u.passwordHash != :sentinel', {
        sentinel: OAUTH_GOOGLE_PASSWORD_SENTINEL,
      })
      .andWhere('u.passwordChangedAt <= :cutoff', { cutoff })
      .andWhere(
        '(u.passwordReminderSentAt IS NULL OR u.passwordReminderSentAt <= :cutoff)',
        { cutoff },
      )
      .getMany();
    return entities.map((e) => ({
      id: e.id,
      email: e.email,
      username: e.username,
    }));
  }

  async markPasswordReminderSent(id: string): Promise<void> {
    await this.repository.update({ id }, { passwordReminderSentAt: new Date() });
  }

  // --- Brands ---

  async setBrandFlag(id: string, isBrand: boolean): Promise<void> {
    await this.repository.update({ id }, { isBrand });
  }

  async createBrandUser(params: CreateBrandUserParams): Promise<User> {
    const created = this.repository.create({
      email: params.email,
      username: params.username,
      firstName: params.firstName,
      lastName: params.lastName,
      passwordHash: params.passwordHash,
      ageRange: '18-24',
      verified: true,
      isBrand: true,
      role: Role.BRANDUSER,
      passwordChanged: false,
    });
    const saved = await this.repository.save(created);
    return this.toDomain(saved);
  }

  async findAdminEmails(): Promise<string[]> {
    const admins = await this.repository.find({
      where: { role: Role.ADMIN },
      select: { email: true },
    });
    return admins.map((a) => a.email);
  }

  // --- Interests ---

  async getInterestIds(userId: string): Promise<string[]> {
    const rows = await this.repository.manager.query<{ interest_id: string }[]>(
      `SELECT interest_id FROM user_interest WHERE user_id = $1`,
      [userId],
    );
    return rows.map((r) => r.interest_id);
  }

  async setInterestIds(userId: string, interestIds: string[]): Promise<void> {
    await this.repository.manager.query(
      `DELETE FROM user_interest WHERE user_id = $1`,
      [userId],
    );
    await this.linkInterests(userId, interestIds);
  }

  // --- 2FA TOTP ---

  async getTwoFactorSecret(userId: string): Promise<string | null> {
    // twoFactorSecret est `select: false` → addSelect explicite.
    const entity = await this.repository
      .createQueryBuilder('u')
      .addSelect('u.twoFactorSecret')
      .where('u.id = :userId', { userId })
      .getOne();
    return entity?.twoFactorSecret ?? null;
  }

  async setTwoFactorSecret(
    userId: string,
    encryptedSecret: string,
  ): Promise<void> {
    await this.repository.update(
      { id: userId },
      { twoFactorSecret: encryptedSecret },
    );
  }

  async enableTwoFactor(userId: string): Promise<void> {
    await this.repository.update({ id: userId }, { twoFactorEnabled: true });
  }

  async disableTwoFactor(userId: string): Promise<void> {
    await this.repository.update(
      { id: userId },
      { twoFactorEnabled: false, twoFactorSecret: null },
    );
  }

  // --- Helpers ---

  private async linkInterests(
    userId: string,
    interests?: string[],
  ): Promise<void> {
    if (!interests || interests.length === 0) return;
    for (const interestId of interests) {
      await this.repository.manager.query(
        `INSERT INTO user_interest (user_id, interest_id)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, interestId],
      );
    }
  }

  /** Même approche que `TypeOrmRefreshTokenRepository` : on ne stocke jamais le token en clair. */
  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async getOrThrow(id: string): Promise<User> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new UserNotFoundError(id);
    }
    return this.toDomain(entity);
  }

  private toDomain(entity: UserOrmEntity): User {
    return new User(
      entity.id,
      entity.email,
      entity.username,
      entity.firstName,
      entity.lastName,
      entity.ageRange,
      entity.avatarUrl,
      entity.blockchainAddress,
      entity.verified,
      entity.isBrand,
      entity.role,
      entity.passwordChanged,
      entity.lastLogin,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt,
      entity.twoFactorEnabled,
    );
  }
}
