import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/user.repository';
import { UserBanRepository } from '../../domain/user-ban.repository';
import { UserBan } from '../../domain/user-ban';
import { ListBansQuery } from '../dto/list-bans.query';

export interface UserBanEntry {
  ban: UserBan;
  username: string | null;
  bannedByUsername: string | null;
}

/** Liste admin des bans utilisateurs, avec les noms résolus (même schéma N+1
 * assumé que `list-brands-for-whitelist.use-case.ts`, échelle admin réduite). */
@Injectable()
export class ListUserBansUseCase {
  constructor(
    private readonly userBans: UserBanRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    query: ListBansQuery,
  ): Promise<{ bans: UserBanEntry[]; total: number }> {
    const { bans, total } = await this.userBans.list(query);
    const entries = await Promise.all(
      bans.map(async (ban) => {
        const [user, bannedBy] = await Promise.all([
          this.userRepository.findById(ban.userId),
          this.userRepository.findById(ban.bannedBy),
        ]);
        return {
          ban,
          username: user?.username ?? null,
          bannedByUsername: bannedBy?.username ?? null,
        };
      }),
    );
    return { bans: entries, total };
  }
}
