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
import { TotpService } from './application/ports/totp.port';
import { TwoFactorSecretCipher } from './application/ports/two-factor-secret-cipher.port';
import { TwoFactorChallengeRepository } from './domain/two-factor-challenge.repository';
// Adapters
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher';
import { JwtAppTokenService } from './infrastructure/jwt-app-token.service';
import { CryptoTokenGenerator } from './infrastructure/crypto-token-generator';
import { EmailMailer } from './infrastructure/email/email-mailer';
import { GoogleOAuthProvider } from './infrastructure/google-oauth.provider';
import { OtplibTotpService } from './infrastructure/otplib-totp.service';
import { AesTwoFactorSecretCipher } from './infrastructure/aes-two-factor-secret-cipher';
import { TypeOrmTwoFactorChallengeRepository } from './infrastructure/typeorm-two-factor-challenge.repository';
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
import { SetupTwoFactorUseCase } from './application/use-cases/setup-two-factor.use-case';
import { EnableTwoFactorUseCase } from './application/use-cases/enable-two-factor.use-case';
import { DisableTwoFactorUseCase } from './application/use-cases/disable-two-factor.use-case';
import { VerifyTwoFactorUseCase } from './application/use-cases/verify-two-factor.use-case';

/**
 * Module d'authentification. Consomme `UserRepository`/`TwoFactorRecoveryCodeRepository`
 * (exportés par UsersModule), lie chaque port à son adapter, et expose
 * `AuthenticateBearerUseCase` au guard global.
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
    { provide: TotpService, useClass: OtplibTotpService },
    { provide: TwoFactorSecretCipher, useClass: AesTwoFactorSecretCipher },
    {
      provide: TwoFactorChallengeRepository,
      useClass: TypeOrmTwoFactorChallengeRepository,
    },
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
    SetupTwoFactorUseCase,
    EnableTwoFactorUseCase,
    DisableTwoFactorUseCase,
    VerifyTwoFactorUseCase,
  ],
  // PasswordHasher + SecureTokenGenerator réutilisés par le module brands
  // (création du compte BRANDUSER, token de vérification de candidature).
  exports: [AuthenticateBearerUseCase, PasswordHasher, SecureTokenGenerator],
})
export class AuthModule {}
