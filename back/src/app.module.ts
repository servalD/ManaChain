import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    DatabaseModule,
    MetricsModule,
    UsersModule,
    AuthModule,
    LikesModule,
    BrandsModule,
    TokensModule,
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
