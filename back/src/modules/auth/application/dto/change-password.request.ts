import { IsStrongPassword } from './password.rules';

export class ChangePasswordRequest {
  @IsStrongPassword()
  newPassword: string;
}
