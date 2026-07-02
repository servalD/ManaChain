import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/user.repository';

/** Liste les centres d'intérêt de l'utilisateur courant. */
@Injectable()
export class GetMyInterestsUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  execute(userId: string): Promise<string[]> {
    return this.userRepository.getInterestIds(userId);
  }
}
