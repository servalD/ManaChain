import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Role } from '../../../shared/enums/role.enum';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Env } from '../../../infrastructure/config/env.validation';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { Public } from '../../../shared/decorators/public.decorator';
import { OAuthEmailUsesPasswordError } from '../domain/auth.errors';
import { User } from '../../users/domain/user';
import { RegisterUseCase } from '../application/use-cases/register.use-case';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { VerifyEmailUseCase } from '../application/use-cases/verify-email.use-case';
import { ResendVerificationUseCase } from '../application/use-cases/resend-verification.use-case';
import { RequestPasswordResetUseCase } from '../application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../application/use-cases/reset-password.use-case';
import { ChangePasswordUseCase } from '../application/use-cases/change-password.use-case';
import { GoogleLoginUseCase } from '../application/use-cases/google-login.use-case';
import { GoogleCallbackUseCase } from '../application/use-cases/google-callback.use-case';
import { SetupTwoFactorUseCase } from '../application/use-cases/setup-two-factor.use-case';
import { EnableTwoFactorUseCase } from '../application/use-cases/enable-two-factor.use-case';
import { DisableTwoFactorUseCase } from '../application/use-cases/disable-two-factor.use-case';
import { VerifyTwoFactorUseCase } from '../application/use-cases/verify-two-factor.use-case';
import { RefreshSessionUseCase } from '../application/use-cases/refresh-session.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';
import { RegisterRequest } from '../application/dto/register.request';
import { LoginRequest } from '../application/dto/login.request';
import { EmailRequest } from '../application/dto/email.request';
import { VerifyEmailRequest } from '../application/dto/verify-email.request';
import { ResetPasswordRequest } from '../application/dto/reset-password.request';
import { ChangePasswordRequest } from '../application/dto/change-password.request';
import { TwoFactorEnableRequest } from '../application/dto/two-factor-enable.request';
import { TwoFactorDisableRequest } from '../application/dto/two-factor-disable.request';
import { TwoFactorVerifyRequest } from '../application/dto/two-factor-verify.request';
import { RefreshRequest } from '../application/dto/refresh.request';
import { LogoutRequest } from '../application/dto/logout.request';
import {
  AuthResponse,
  LoginResponse,
  MessageResponse,
  toAuthResponse,
  toLoginSuccessResponse,
  toTwoFactorRequiredResponse,
  TwoFactorEnableResponse,
  TwoFactorSetupResponse,
} from './auth.presenter';
import {
  toUserResponse,
  UserResponse,
} from '../../users/presentation/user.presenter';

const RESET_REQUESTED_MESSAGE =
  'If an account exists with this email, you will receive a password reset link.';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly resendVerificationUseCase: ResendVerificationUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly googleLoginUseCase: GoogleLoginUseCase,
    private readonly googleCallbackUseCase: GoogleCallbackUseCase,
    private readonly setupTwoFactorUseCase: SetupTwoFactorUseCase,
    private readonly enableTwoFactorUseCase: EnableTwoFactorUseCase,
    private readonly disableTwoFactorUseCase: DisableTwoFactorUseCase,
    private readonly verifyTwoFactorUseCase: VerifyTwoFactorUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('register')
  @ApiOperation({ summary: 'Inscription (compte local)' })
  @ApiCreatedResponse({ type: AuthResponse })
  async register(@Body() body: RegisterRequest): Promise<AuthResponse> {
    const user = await this.registerUseCase.execute({
      ...body,
      role: this.isBootstrapAdminEmail(body.email) ? Role.ADMIN : undefined,
      verified: this.config.get('SKIP_EMAIL_VERIFICATION', { infer: true })
        ? true
        : undefined,
    });
    return toAuthResponse(
      user,
      null,
      'Registration successful. Please verify your email.',
    );
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion (email + mot de passe)' })
  @ApiOkResponse({ type: LoginResponse })
  async login(@Body() body: LoginRequest): Promise<LoginResponse> {
    const result = await this.loginUseCase.execute(body.email, body.password);
    if (result.twoFactorRequired) {
      return toTwoFactorRequiredResponse(result.challengeToken);
    }
    return toLoginSuccessResponse(
      result.user,
      result.token,
      result.refreshToken,
      'Login successful',
    );
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Vérifier l'adresse email" })
  async verifyEmail(
    @Body() body: VerifyEmailRequest,
  ): Promise<{ message: string; user: UserResponse }> {
    const user = await this.verifyEmailUseCase.execute(body.token);
    return {
      message: 'Email verified successfully',
      user: toUserResponse(user),
    };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Renvoyer l'email de vérification" })
  @ApiOkResponse({ type: MessageResponse })
  async resendVerification(
    @Body() body: EmailRequest,
  ): Promise<MessageResponse> {
    await this.resendVerificationUseCase.execute(body.email);
    return { message: 'Verification email sent' };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demander un reset de mot de passe' })
  @ApiOkResponse({ type: MessageResponse })
  async forgotPassword(@Body() body: EmailRequest): Promise<MessageResponse> {
    await this.requestPasswordResetUseCase.execute(body.email);
    return { message: RESET_REQUESTED_MESSAGE };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Réinitialiser le mot de passe via token' })
  @ApiOkResponse({ type: MessageResponse })
  async resetPassword(
    @Body() body: ResetPasswordRequest,
  ): Promise<MessageResponse> {
    await this.resetPasswordUseCase.execute(body.token, body.newPassword);
    return { message: 'Password reset successfully' };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Changer son mot de passe (authentifié)' })
  @ApiOkResponse({ type: MessageResponse })
  async changePassword(
    @CurrentUser() user: User,
    @Body() body: ChangePasswordRequest,
  ): Promise<MessageResponse> {
    await this.changePasswordUseCase.execute(
      user.id,
      body.currentPassword,
      body.newPassword,
    );
    return { message: 'Password changed successfully' };
  }

  @Public()
  @Get('google')
  @ApiOperation({ summary: 'Rediriger vers le consentement Google' })
  googleAuth(@Res() res: Response): void {
    try {
      res.redirect(HttpStatus.FOUND, this.googleLoginUseCase.execute());
    } catch {
      res.redirect(`${this.frontendUrl}/login?error=google_failed`);
    }
  }

  @Public()
  @Get('google/callback')
  @ApiOperation({ summary: 'Callback Google OAuth' })
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    if (error || !code) {
      const reason = error ? 'access_denied' : 'google_failed';
      res.redirect(`${this.frontendUrl}/login?error=${reason}`);
      return;
    }

    try {
      const result = await this.googleCallbackUseCase.execute(code);
      const params = result.twoFactorRequired
        ? new URLSearchParams({
            twoFactorRequired: 'true',
            challengeToken: result.challengeToken,
          })
        : new URLSearchParams({
            token: result.token,
            refreshToken: result.refreshToken,
            role: result.role,
          });
      res.redirect(
        HttpStatus.FOUND,
        `${this.frontendUrl}/login?${params.toString()}`,
      );
    } catch (err) {
      const reason =
        err instanceof OAuthEmailUsesPasswordError
          ? 'use_password'
          : 'google_failed';
      res.redirect(`${this.frontendUrl}/login?error=${reason}`);
    }
  }

  @Post('2fa/setup')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Démarrer la configuration du 2FA (génère un secret TOTP)',
  })
  @ApiOkResponse({ type: TwoFactorSetupResponse })
  setupTwoFactor(@CurrentUser() user: User): Promise<TwoFactorSetupResponse> {
    return this.setupTwoFactorUseCase.execute(user.id);
  }

  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Activer le 2FA (confirme le secret avec un code live)',
  })
  @ApiOkResponse({ type: TwoFactorEnableResponse })
  async enableTwoFactor(
    @CurrentUser() user: User,
    @Body() body: TwoFactorEnableRequest,
  ): Promise<TwoFactorEnableResponse> {
    const recoveryCodes = await this.enableTwoFactorUseCase.execute(
      user.id,
      body.code,
    );
    return { recoveryCodes };
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Désactiver le 2FA (confirmation par mot de passe)',
  })
  @ApiOkResponse({ type: MessageResponse })
  async disableTwoFactor(
    @CurrentUser() user: User,
    @Body() body: TwoFactorDisableRequest,
  ): Promise<MessageResponse> {
    await this.disableTwoFactorUseCase.execute(user.id, body.password);
    return { message: 'Two-factor authentication disabled' };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Résoudre le challenge 2FA posé par /auth/login ou /auth/google/callback',
  })
  @ApiOkResponse({ type: LoginResponse })
  async verifyTwoFactor(
    @Body() body: TwoFactorVerifyRequest,
  ): Promise<LoginResponse> {
    const { user, token, refreshToken } =
      await this.verifyTwoFactorUseCase.execute(body.challengeToken, body.code);
    return toLoginSuccessResponse(
      user,
      token,
      refreshToken,
      'Login successful',
    );
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Échanger un refresh token contre une nouvelle session',
  })
  @ApiOkResponse({ type: LoginResponse })
  async refresh(@Body() body: RefreshRequest): Promise<LoginResponse> {
    const { user, token, refreshToken } =
      await this.refreshSessionUseCase.execute(body.refreshToken);
    return toLoginSuccessResponse(
      user,
      token,
      refreshToken,
      'Session refreshed',
    );
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Révoquer un refresh token' })
  @ApiOkResponse({ type: MessageResponse })
  async logout(@Body() body: LogoutRequest): Promise<MessageResponse> {
    await this.logoutUseCase.execute(body.refreshToken);
    return { message: 'Logged out' };
  }

  private get frontendUrl(): string {
    return this.config.get('FRONTEND_URL', { infer: true });
  }

  /** Bootstrap : promeut en ADMIN l'inscription correspondant à `BOOTSTRAP_ADMIN_EMAIL`. */
  private isBootstrapAdminEmail(email: string): boolean {
    const bootstrapEmail = this.config.get('BOOTSTRAP_ADMIN_EMAIL', {
      infer: true,
    });
    return (
      !!bootstrapEmail && bootstrapEmail.toLowerCase() === email.toLowerCase()
    );
  }
}
