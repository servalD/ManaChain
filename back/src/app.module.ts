import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { validateEnv } from './infrastructure/config/env.validation';
import { DatabaseModule } from './infrastructure/database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './shared/guards/auth.guard';
import { RolesGuard } from './shared/guards/roles.guard';
import { DomainExceptionFilter } from './shared/filters/domain-exception.filter';
import { HealthController } from './health.controller';
import { LikesModule } from './modules/likes/likes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    LikesModule,
  ],
  controllers: [HealthController],
  providers: [
    // Traduit les exceptions de domaine en réponses HTTP (présentation).
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    // L'ordre compte : AuthGuard authentifie avant que RolesGuard n'autorise.
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
