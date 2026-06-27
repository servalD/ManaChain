import { Injectable } from '@nestjs/common';
import { User } from '../../domain/user';
import { UpdateUserFields, UserRepository } from '../../domain/user.repository';
import {
  UsernameAlreadyTakenError,
  UserNotFoundError,
} from '../../domain/user.errors';

/**
 * Met à jour le profil de l'utilisateur courant. Vérifie l'unicité du username
 * avant écriture. Ne lève que des exceptions de DOMAINE (jamais `@nestjs/*`).
 */
@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string, fields: UpdateUserFields): Promise<User> {
    const current = await this.userRepository.findById(userId);
    if (!current) {
      throw new UserNotFoundError(userId);
    }

    if (fields.username && fields.username !== current.username) {
      const owner = await this.userRepository.findByUsername(fields.username);
      if (owner && owner.id !== userId) {
        throw new UsernameAlreadyTakenError(fields.username);
      }
    }

    return this.userRepository.updateProfile(userId, fields);
  }
}
