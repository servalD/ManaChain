import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/domain/user';
import {
  toUserResponse,
  UserResponse,
} from '../../users/presentation/user.presenter';

export class AuthResponse {
  @ApiProperty()
  message: string;

  @ApiProperty({ type: UserResponse })
  user: UserResponse;

  @ApiProperty({ type: String, nullable: true })
  token: string | null;
}

export class MessageResponse {
  @ApiProperty()
  message: string;
}

export const toAuthResponse = (
  user: User,
  token: string | null,
  message: string,
): AuthResponse => ({
  message,
  user: toUserResponse(user),
  token,
});

/**
 * Réponse de `/auth/login`, `/auth/google/callback` (implicitement, via
 * redirection) et `/auth/2fa/verify` : soit une session complète, soit un
 * challenge 2FA à résoudre. Champs à plat (plutôt qu'un union type côté
 * Swagger/orval) pour rester simple à générer/consommer côté client.
 */
export class LoginResponse {
  @ApiProperty()
  message: string;

  @ApiProperty()
  twoFactorRequired: boolean;

  @ApiProperty({ type: String, nullable: true })
  challengeToken: string | null;

  @ApiProperty({ type: UserResponse, nullable: true })
  user: UserResponse | null;

  @ApiProperty({ type: String, nullable: true })
  token: string | null;
}

export const toLoginSuccessResponse = (
  user: User,
  token: string,
  message: string,
): LoginResponse => ({
  message,
  twoFactorRequired: false,
  challengeToken: null,
  user: toUserResponse(user),
  token,
});

export const toTwoFactorRequiredResponse = (
  challengeToken: string,
): LoginResponse => ({
  message: 'Two-factor authentication code required',
  twoFactorRequired: true,
  challengeToken,
  user: null,
  token: null,
});

export class TwoFactorSetupResponse {
  @ApiProperty({ description: 'Secret Base32, pour saisie manuelle si le QR ne peut pas être scanné' })
  secret: string;

  @ApiProperty({ description: 'URI otpauth://totp/... pour générer le QR code côté client' })
  otpauthUri: string;
}

export class TwoFactorEnableResponse {
  @ApiProperty({
    type: [String],
    description: "Codes de récupération à usage unique, affichés une seule fois",
  })
  recoveryCodes: string[];
}
