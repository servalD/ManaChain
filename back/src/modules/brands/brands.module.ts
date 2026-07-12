import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../../infrastructure/email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
// ORM entities
import { BrandOrmEntity } from './infrastructure/brand.orm-entity';
import { BrandApplicationOrmEntity } from './infrastructure/brand-application.orm-entity';
import { BrandApplicationProofUploadOrmEntity } from './infrastructure/brand-application-proof-upload.orm-entity';
import { BrandMediaOrmEntity } from './infrastructure/brand-media.orm-entity';
// Ports
import { BrandRepository } from './domain/brand.repository';
import { BrandApplicationRepository } from './domain/brand-application.repository';
import { BrandApplicationProofUploadStore } from './domain/brand-application-proof-upload.store';
import { BrandMediaRepository } from './domain/brand-media.repository';
import { InterestChecker } from './domain/interest-checker';
import { InterestReader } from './domain/interest-reader';
import { BrandApplicationMailer } from './domain/brand-application-mailer.port';
import { TemporaryPasswordGenerator } from './domain/temporary-password-generator';
import { BrandTokenStatsReader } from './domain/brand-token-stats.reader';
import { BrandEngagementHistoryReader } from './domain/brand-engagement-history.reader';
import { BrandBanReader } from './domain/brand-ban.reader';
import { BrandBanRepository } from './domain/brand-ban.repository';
// Adapters
import { TypeOrmBrandRepository } from './infrastructure/typeorm-brand.repository';
import { TypeOrmBrandApplicationRepository } from './infrastructure/typeorm-brand-application.repository';
import { TypeOrmBrandApplicationProofUploadStore } from './infrastructure/typeorm-brand-application-proof-upload.store';
import { TypeOrmBrandMediaRepository } from './infrastructure/typeorm-brand-media.repository';
import { TypeOrmInterestChecker } from './infrastructure/typeorm-interest-checker';
import { TypeOrmInterestReader } from './infrastructure/typeorm-interest-reader';
import { TemplatedBrandApplicationMailer } from './infrastructure/email/templated-brand-application-mailer';
import { SecureTemporaryPasswordGenerator } from './infrastructure/secure-temporary-password.generator';
import { TypeOrmBrandTokenStatsReader } from './infrastructure/typeorm-brand-token-stats.reader';
import { TypeOrmBrandEngagementHistoryReader } from './infrastructure/typeorm-brand-engagement-history.reader';
import { TypeOrmBrandBanReader } from './infrastructure/typeorm-brand-ban.reader';
import { TypeOrmBrandBanRepository } from './infrastructure/typeorm-brand-ban.repository';
// Use-cases
import { CreateBrandUseCase } from './application/use-cases/create-brand.use-case';
import { GetBrandUseCase } from './application/use-cases/get-brand.use-case';
import { GetBrandByUserUseCase } from './application/use-cases/get-brand-by-user.use-case';
import { ListBrandsUseCase } from './application/use-cases/list-brands.use-case';
import { ListActiveBrandsUseCase } from './application/use-cases/list-active-brands.use-case';
import { ListBrandsForWhitelistUseCase } from './application/use-cases/list-brands-for-whitelist.use-case';
import { UpdateBrandUseCase } from './application/use-cases/update-brand.use-case';
import { DeleteBrandUseCase } from './application/use-cases/delete-brand.use-case';
import { GetBrandStatsUseCase } from './application/use-cases/get-brand-stats.use-case';
import { GetBrandEngagementHistoryUseCase } from './application/use-cases/get-brand-engagement-history.use-case';
import { ListBrandMediaUseCase } from './application/use-cases/list-brand-media.use-case';
import { ConfirmBrandMediaUseCase } from './application/use-cases/confirm-brand-media.use-case';
import { DeleteBrandMediaUseCase } from './application/use-cases/delete-brand-media.use-case';
import { CreateBrandApplicationUseCase } from './application/use-cases/create-brand-application.use-case';
import { VerifyBrandApplicationEmailUseCase } from './application/use-cases/verify-brand-application-email.use-case';
import { ListBrandApplicationsUseCase } from './application/use-cases/list-brand-applications.use-case';
import { GetBrandApplicationUseCase } from './application/use-cases/get-brand-application.use-case';
import { ApproveBrandApplicationUseCase } from './application/use-cases/approve-brand-application.use-case';
import { RejectBrandApplicationUseCase } from './application/use-cases/reject-brand-application.use-case';
import { UploadBrandApplicationProofUseCase } from './application/use-cases/upload-brand-application-proof.use-case';
import { DeleteBrandApplicationProofUploadUseCase } from './application/use-cases/delete-brand-application-proof-upload.use-case';
import { GetBrandApplicationRegistrationProofUseCase } from './application/use-cases/get-brand-application-registration-proof.use-case';
import { ListInterestsUseCase } from './application/use-cases/list-interests.use-case';
import { BanBrandUseCase } from './application/use-cases/ban-brand.use-case';
import { UnbanBrandUseCase } from './application/use-cases/unban-brand.use-case';
import { ListBrandBansUseCase } from './application/use-cases/list-brand-bans.use-case';
// Controllers
import { BrandApplicationsController } from './presentation/brand-applications.controller';
import { BrandsController } from './presentation/brands.controller';
import { InterestsController } from './presentation/interests.controller';
// Schedulers
import { RegistrationProofUploadCleanupScheduler } from './infrastructure/registration-proof-upload-cleanup.scheduler';

/**
 * Module marques : CRUD marques + médias + cycle de candidature. Consomme
 * `UserRepository` (UsersModule), `PasswordHasher`/`SecureTokenGenerator`
 * (AuthModule) et le transport email partagé (EmailModule).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      BrandOrmEntity,
      BrandApplicationOrmEntity,
      BrandApplicationProofUploadOrmEntity,
      BrandMediaOrmEntity,
    ]),
    UsersModule,
    AuthModule,
    EmailModule,
    NotificationsModule,
  ],
  controllers: [
    BrandApplicationsController,
    BrandsController,
    InterestsController,
  ],
  providers: [
    { provide: BrandRepository, useClass: TypeOrmBrandRepository },
    {
      provide: BrandApplicationRepository,
      useClass: TypeOrmBrandApplicationRepository,
    },
    {
      provide: BrandApplicationProofUploadStore,
      useClass: TypeOrmBrandApplicationProofUploadStore,
    },
    { provide: BrandMediaRepository, useClass: TypeOrmBrandMediaRepository },
    { provide: InterestChecker, useClass: TypeOrmInterestChecker },
    { provide: InterestReader, useClass: TypeOrmInterestReader },
    {
      provide: BrandApplicationMailer,
      useClass: TemplatedBrandApplicationMailer,
    },
    {
      provide: TemporaryPasswordGenerator,
      useClass: SecureTemporaryPasswordGenerator,
    },
    { provide: BrandTokenStatsReader, useClass: TypeOrmBrandTokenStatsReader },
    {
      provide: BrandEngagementHistoryReader,
      useClass: TypeOrmBrandEngagementHistoryReader,
    },
    { provide: BrandBanReader, useClass: TypeOrmBrandBanReader },
    { provide: BrandBanRepository, useClass: TypeOrmBrandBanRepository },
    CreateBrandUseCase,
    GetBrandUseCase,
    GetBrandByUserUseCase,
    ListBrandsUseCase,
    ListActiveBrandsUseCase,
    ListBrandsForWhitelistUseCase,
    UpdateBrandUseCase,
    DeleteBrandUseCase,
    GetBrandStatsUseCase,
    GetBrandEngagementHistoryUseCase,
    ListBrandMediaUseCase,
    ConfirmBrandMediaUseCase,
    DeleteBrandMediaUseCase,
    CreateBrandApplicationUseCase,
    VerifyBrandApplicationEmailUseCase,
    ListBrandApplicationsUseCase,
    GetBrandApplicationUseCase,
    ApproveBrandApplicationUseCase,
    RejectBrandApplicationUseCase,
    UploadBrandApplicationProofUseCase,
    DeleteBrandApplicationProofUploadUseCase,
    GetBrandApplicationRegistrationProofUseCase,
    ListInterestsUseCase,
    BanBrandUseCase,
    UnbanBrandUseCase,
    ListBrandBansUseCase,
    RegistrationProofUploadCleanupScheduler,
  ],
  // Exporté pour les modules `likes` et `tokens` (délégation de leurs ports de
  // lecture marque au vrai repository, fin du SQL dupliqué).
  exports: [BrandRepository],
})
export class BrandsModule {}
