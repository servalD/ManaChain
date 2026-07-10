import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from './infrastructure/user.orm-entity';
import { TypeOrmUserRepository } from './infrastructure/typeorm-user.repository';
import { TypeOrmUserBanRepository } from './infrastructure/typeorm-user-ban.repository';
import { UserRepository } from './domain/user.repository';
import { UserBanRepository } from './domain/user-ban.repository';
import { GetAllUsersUseCase } from './application/use-cases/get-all-users.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { UpdateBlockchainAddressUseCase } from './application/use-cases/update-blockchain-address.use-case';
import { GetMyInterestsUseCase } from './application/use-cases/get-my-interests.use-case';
import { UpdateMyInterestsUseCase } from './application/use-cases/update-my-interests.use-case';
import { BanUserUseCase } from './application/use-cases/ban-user.use-case';
import { UnbanUserUseCase } from './application/use-cases/unban-user.use-case';
import { ListUserBansUseCase } from './application/use-cases/list-user-bans.use-case';
import { UsersController } from './presentation/users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [UsersController],
  providers: [
    // Le port est lié à son adapter TypeORM.
    { provide: UserRepository, useClass: TypeOrmUserRepository },
    { provide: UserBanRepository, useClass: TypeOrmUserBanRepository },
    GetAllUsersUseCase,
    UpdateUserUseCase,
    UpdateBlockchainAddressUseCase,
    GetMyInterestsUseCase,
    UpdateMyInterestsUseCase,
    BanUserUseCase,
    UnbanUserUseCase,
    ListUserBansUseCase,
  ],
  // UserRepository/UserBanRepository sont consommés par le module auth (guard
  // global + login) et chain-sync.
  exports: [UserRepository, UserBanRepository],
})
export class UsersModule {}
