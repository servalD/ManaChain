import { User } from './user';

/** Champs de profil modifiables via `PUT /users/me`. */
export interface UpdateUserFields {
  firstName?: string;
  lastName?: string;
  username?: string;
  avatarUrl?: string | null;
}

/**
 * Repository PORT (hexagonal). Utilisé comme token DI ; l'adapter TypeORM vit
 * dans la couche infrastructure et est lié dans {@link UsersModule}. Un fake
 * in-memory ({@link InMemoryUserRepository}) sert aux tests.
 */
export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findAll(): Promise<User[]>;
  abstract findByUsername(username: string): Promise<User | null>;
  abstract findByBlockchainAddress(address: string): Promise<User | null>;
  abstract updateProfile(id: string, fields: UpdateUserFields): Promise<User>;
  abstract updateBlockchainAddress(id: string, address: string): Promise<User>;
}
