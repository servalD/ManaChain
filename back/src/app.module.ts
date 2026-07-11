import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { validateEnv } from './infrastructure/config/env.validation';
import { DatabaseModule } from './infrastructure/database/database.module';
import { MetricsModule } from './infrastructure/monitoring/metrics.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './shared/guards/auth.guard';
import { RolesGuard } from './shared/guards/roles.guard';
import { DomainExceptionFilter } from './shared/filters/domain-exception.filter';
import { HealthController } from './health.controller';
import { LikesModule } from './modules/likes/likes.module';
import { BrandsModule } from './modules/brands/brands.module';
import { TokensModule } from './modules/tokens/tokens.module';
import { EventsModule } from './modules/events/events.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ChainSyncModule } from './modules/chain-sync/chain-sync.module';
import { MediaModule } from './modules/media/media.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    // Premier module du back à utiliser le scheduling (chain-sync.service.ts).
    ScheduleModule.forRoot(),
    // Découple UpdateBlockchainAddressUseCase (users) du rattrapage chain-sync.
    EventEmitterModule.forRoot(),
    DatabaseModule,
    MetricsModule,
    UsersModule,
    AuthModule,
    LikesModule,
    BrandsModule,
    TokensModule,
    EventsModule,
    NotificationsModule,
    ChainSyncModule,
    MediaModule,
  ],
  controllers: [HealthController],
  providers: [
    // Doit être déclaré avant les autres filtres (recommandation Sentry) :
    // rapporte l'exception à Sentry puis la laisse retomber sur le filtre suivant.
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    // Traduit les exceptions de domaine en réponses HTTP (présentation).
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    // L'ordre compte : AuthGuard authentifie avant que RolesGuard n'autorise.
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
