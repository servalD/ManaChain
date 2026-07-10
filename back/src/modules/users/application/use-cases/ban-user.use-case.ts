import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/user.repository';
import { UserBanRepository } from '../../domain/user-ban.repository';
import { UserBan } from '../../domain/user-ban';
import {
  UserAlreadyBannedError,
  UserNotFoundError,
} from '../../domain/user.errors';
import { BanUserRequest } from '../dto/ban-user.request';

@Injectable()
export class BanUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userBans: UserBanRepository,
  ) {}

  async execute(
    adminId: string,
    userId: string,
    body: BanUserRequest,
  ): Promise<UserBan> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError(userId);

    const existing = await this.userBans.findActive(userId);
    if (existing) throw new UserAlreadyBannedError();

    return this.userBans.create({
      userId,
      reason: body.reason,
      bannedBy: adminId,
      isPermanent: body.isPermanent,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      notes: body.notes ?? null,
    });
  }
}
