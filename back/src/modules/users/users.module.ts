import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from './infrastructure/user.orm-entity';
import { TypeOrmUserRepository } from './infrastructure/typeorm-user.repository';
import { UserRepository } from './domain/user.repository';
import { GetAllUsersUseCase } from './application/use-cases/get-all-users.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { UpdateBlockchainAddressUseCase } from './application/use-cases/update-blockchain-address.use-case';
import { GetMyInterestsUseCase } from './application/use-cases/get-my-interests.use-case';
import { UpdateMyInterestsUseCase } from './application/use-cases/update-my-interests.use-case';
import { UsersController } from './presentation/users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [UsersController],
  providers: [
    // Le port est lié à son adapter TypeORM.
    { provide: UserRepository, useClass: TypeOrmUserRepository },
    GetAllUsersUseCase,
    UpdateUserUseCase,
    UpdateBlockchainAddressUseCase,
    GetMyInterestsUseCase,
    UpdateMyInterestsUseCase,
  ],
  // UserRepository est consommé par le module auth (guard global) et chain-sync.
  exports: [UserRepository],
})
export class UsersModule {}
