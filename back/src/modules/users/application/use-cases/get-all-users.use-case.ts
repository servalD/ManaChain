import { Injectable } from '@nestjs/common';
import { User } from '../../domain/user';
import { UserRepository } from '../../domain/user.repository';

/** Admin : liste tous les utilisateurs. */
@Injectable()
export class GetAllUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  execute(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
