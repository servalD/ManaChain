import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokensModule } from '../tokens/tokens.module';
import { UserOrmEntity } from './infrastructure/user.orm-entity';
import { TypeOrmUserRepository } from './infrastructure/typeorm-user.repository';
import { TypeOrmUserBanRepository } from './infrastructure/typeorm-user-ban.repository';
import { TypeOrmTwoFactorRecoveryCodeRepository } from './infrastructure/typeorm-two-factor-recovery-code.repository';
import { UserRepository } from './domain/user.repository';
import { UserBanRepository } from './domain/user-ban.repository';
import { TwoFactorRecoveryCodeRepository } from './domain/two-factor-recovery-code.repository';
import { GetAllUsersUseCase } from './application/use-cases/get-all-users.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { UpdateBlockchainAddressUseCase } from './application/use-cases/update-blockchain-address.use-case';
import { GetMyInterestsUseCase } from './application/use-cases/get-my-interests.use-case';
import { UpdateMyInterestsUseCase } from './application/use-cases/update-my-interests.use-case';
import { BanUserUseCase } from './application/use-cases/ban-user.use-case';
import { UnbanUserUseCase } from './application/use-cases/unban-user.use-case';
import { ListUserBansUseCase } from './application/use-cases/list-user-bans.use-case';
import { DeleteAccountUseCase } from './application/use-cases/delete-account.use-case';
import { UsersController } from './presentation/users.controller';

@Module({
  // TokensModule : DeleteAccountUseCase délink l'historique de transactions
  // (TokenTransactionRepository) avant d'anonymiser — TokensModule n'importe
  // pas UsersModule, pas de cycle.
  imports: [TypeOrmModule.forFeature([UserOrmEntity]), TokensModule],
  controllers: [UsersController],
  providers: [
    // Le port est lié à son adapter TypeORM.
    { provide: UserRepository, useClass: TypeOrmUserRepository },
    { provide: UserBanRepository, useClass: TypeOrmUserBanRepository },
    {
      provide: TwoFactorRecoveryCodeRepository,
      useClass: TypeOrmTwoFactorRecoveryCodeRepository,
    },
    GetAllUsersUseCase,
    UpdateUserUseCase,
    UpdateBlockchainAddressUseCase,
    GetMyInterestsUseCase,
    UpdateMyInterestsUseCase,
    BanUserUseCase,
    UnbanUserUseCase,
    ListUserBansUseCase,
    DeleteAccountUseCase,
  ],
  // UserRepository/UserBanRepository sont consommés par le module auth (guard
  // global + login) et chain-sync. TwoFactorRecoveryCodeRepository par les
  // use-cases 2FA du module auth (enable/verify).
  exports: [UserRepository, UserBanRepository, TwoFactorRecoveryCodeRepository],
})
export class UsersModule {}
