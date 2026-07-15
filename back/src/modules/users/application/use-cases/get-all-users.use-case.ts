import { Injectable } from '@nestjs/common';
import { User } from '../../domain/user';
import { ListUsersParams, UserRepository } from '../../domain/user.repository';
import { UserBanRepository } from '../../domain/user-ban.repository';

export interface UserWithBanStatus {
  user: User;
  banned: boolean;
}

/** Admin : liste paginée des utilisateurs (recherche, filtre rôle). */
@Injectable()
export class GetAllUsersUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userBanRepository: UserBanRepository,
  ) {}

  async execute(
    params: ListUsersParams,
  ): Promise<{ users: UserWithBanStatus[]; total: number }> {
    const { users, total } = await this.userRepository.list(params);
    const bannedIds = new Set(
      await this.userBanRepository.findActivelyBannedIds(
        users.map((u) => u.id),
      ),
    );
    return {
      users: users.map((user) => ({ user, banned: bannedIds.has(user.id) })),
      total,
    };
  }
}
