import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthenticateBearerUseCase } from './application/use-cases/authenticate-bearer.use-case';

/**
 * Périmètre du jalon 1 : uniquement la vérification du Bearer pour alimenter le
 * guard global (le back valide les JWT émis par l'Express encore en place).
 * Register / login / Google OAuth / emails arriveront au jalon `auth` complet.
 */
@Module({
  imports: [UsersModule],
  providers: [AuthenticateBearerUseCase],
  exports: [AuthenticateBearerUseCase],
})
export class AuthModule {}
