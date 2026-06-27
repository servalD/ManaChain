import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../domain/user';
import { UpdateUserFields, UserRepository } from '../domain/user.repository';
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
