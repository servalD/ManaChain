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
