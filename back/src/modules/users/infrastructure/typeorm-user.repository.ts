import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../../shared/enums/role.enum';
import { User } from '../domain/user';
import {
  CreateBrandUserParams,
  CreateGoogleUserParams,
  CreateLocalUserParams,
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
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {
    super();
  }

  // --- Profil ---

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<User[]> {
    const entities = await this.repository.find({
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByUsername(username: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { username } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByBlockchainAddress(address: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { blockchainAddress: address },
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

  // --- Auth ---

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { email } });
    return entity ? this.toDomain(entity) : null;
  }

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    // passwordHash est `select: false` → addSelect explicite pour le login.
    const entity = await this.repository
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email })
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
      verified: false,
      isBrand: false,
      role: Role.CLIENT,
      passwordChanged: true,
      emailVerificationToken: params.emailVerificationToken,
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
      where: { emailVerificationToken: token },
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
        emailVerificationToken: token,
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
      where: { passwordResetToken: token },
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
        passwordResetToken: token,
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
      },
    );
    return this.getOrThrow(id);
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
      entity.lastLogin,
      entity.createdAt,
      entity.updatedAt,
    );
  }
}
