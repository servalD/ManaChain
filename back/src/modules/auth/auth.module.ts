import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../../infrastructure/email/email.module';
import { AuthController } from './presentation/auth.controller';
// Ports
import { PasswordHasher } from './application/ports/password-hasher.port';
import { AppTokenService } from './application/ports/app-token.service';
import { SecureTokenGenerator } from './application/ports/secure-token-generator.port';
import { Mailer } from './application/ports/mailer.port';
import { OAuthProvider } from './application/ports/oauth-provider.port';
// Adapters
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher';
import { JwtAppTokenService } from './infrastructure/jwt-app-token.service';
import { CryptoTokenGenerator } from './infrastructure/crypto-token-generator';
import { EmailMailer } from './infrastructure/email/email-mailer';
import { GoogleOAuthProvider } from './infrastructure/google-oauth.provider';
// Use-cases
import { AuthenticateBearerUseCase } from './application/use-cases/authenticate-bearer.use-case';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { ResendVerificationUseCase } from './application/use-cases/resend-verification.use-case';
import { RequestPasswordResetUseCase } from './application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { GoogleLoginUseCase } from './application/use-cases/google-login.use-case';
import { GoogleCallbackUseCase } from './application/use-cases/google-callback.use-case';

/**
 * Module d'authentification. Consomme `UserRepository` (exporté par UsersModule),
 * lie chaque port à son adapter, et expose `AuthenticateBearerUseCase` au guard global.
 */
@Module({
  imports: [UsersModule, EmailModule],
  controllers: [AuthController],
  providers: [
    // Ports → adapters
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
    { provide: AppTokenService, useClass: JwtAppTokenService },
    { provide: SecureTokenGenerator, useClass: CryptoTokenGenerator },
    { provide: Mailer, useClass: EmailMailer },
    { provide: OAuthProvider, useClass: GoogleOAuthProvider },
    // Use-cases
    AuthenticateBearerUseCase,
    RegisterUseCase,
    LoginUseCase,
    VerifyEmailUseCase,
    ResendVerificationUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    ChangePasswordUseCase,
    GoogleLoginUseCase,
    GoogleCallbackUseCase,
  ],
  // PasswordHasher + SecureTokenGenerator réutilisés par le module brands
  // (création du compte BRANDUSER, token de vérification de candidature).
  exports: [AuthenticateBearerUseCase, PasswordHasher, SecureTokenGenerator],
})
export class AuthModule {}
