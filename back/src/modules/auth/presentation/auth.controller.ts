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
import { RegisterRequest } from '../application/dto/register.request';
import { LoginRequest } from '../application/dto/login.request';
import { EmailRequest } from '../application/dto/email.request';
import { VerifyEmailRequest } from '../application/dto/verify-email.request';
import { ResetPasswordRequest } from '../application/dto/reset-password.request';
import { ChangePasswordRequest } from '../application/dto/change-password.request';
import {
  AuthResponse,
  MessageResponse,
  toAuthResponse,
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
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Inscription (compte local)' })
  @ApiCreatedResponse({ type: AuthResponse })
  async register(@Body() body: RegisterRequest): Promise<AuthResponse> {
    const user = await this.registerUseCase.execute(body);
    return toAuthResponse(
      user,
      null,
      'Registration successful. Please verify your email.',
    );
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion (email + mot de passe)' })
  @ApiOkResponse({ type: AuthResponse })
  async login(@Body() body: LoginRequest): Promise<AuthResponse> {
    const { user, token } = await this.loginUseCase.execute(
      body.email,
      body.password,
    );
    return toAuthResponse(user, token, 'Login successful');
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
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demander un reset de mot de passe' })
  @ApiOkResponse({ type: MessageResponse })
  async forgotPassword(@Body() body: EmailRequest): Promise<MessageResponse> {
    await this.requestPasswordResetUseCase.execute(body.email);
    return { message: RESET_REQUESTED_MESSAGE };
  }

  @Public()
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
    await this.changePasswordUseCase.execute(user.id, body.newPassword);
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
      const { token, role } = await this.googleCallbackUseCase.execute(code);
      const params = new URLSearchParams({ token, role });
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

  private get frontendUrl(): string {
    return this.config.get('FRONTEND_URL', { infer: true });
  }
}
