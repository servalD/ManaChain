import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from './infrastructure/user.orm-entity';
import { TypeOrmUserRepository } from './infrastructure/typeorm-user.repository';
import { UserRepository } from './domain/user.repository';
import { GetAllUsersUseCase } from './application/use-cases/get-all-users.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { UpdateBlockchainAddressUseCase } from './application/use-cases/update-blockchain-address.use-case';
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
  ],
  // UserRepository est consommé par le module auth (guard global).
  exports: [UserRepository],
})
export class UsersModule {}
