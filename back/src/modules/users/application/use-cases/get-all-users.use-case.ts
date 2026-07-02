import { Injectable } from '@nestjs/common';
import { User } from '../../domain/user';
import { ListUsersParams, UserRepository } from '../../domain/user.repository';

/** Admin : liste paginée des utilisateurs (recherche, filtre rôle). */
@Injectable()
export class GetAllUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  execute(params: ListUsersParams): Promise<{ users: User[]; total: number }> {
    return this.userRepository.list(params);
  }
}
