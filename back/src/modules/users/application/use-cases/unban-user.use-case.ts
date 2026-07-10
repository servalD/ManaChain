import { Injectable } from '@nestjs/common';
import { UserBanRepository } from '../../domain/user-ban.repository';

@Injectable()
export class UnbanUserUseCase {
  constructor(private readonly userBans: UserBanRepository) {}

  execute(userId: string): Promise<void> {
    return this.userBans.revoke(userId);
  }
}
