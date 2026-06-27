import { Injectable } from '@nestjs/common';
import { User } from '../../../users/domain/user';
import { UserRepository } from '../../../users/domain/user.repository';
import {
  EmailNotVerifiedError,
  InvalidCredentialsError,
} from '../../domain/auth.errors';
import { PasswordHasher } from '../ports/password-hasher.port';
import { AppTokenService } from '../ports/app-token.service';
import { toAppJwtClaims } from '../jwt-claims';

export interface LoginResult {
  user: User;
  token: string;
}

/**
 * Connexion locale : vérifie l'email confirmé + le mot de passe (bcrypt) et
 * signe un JWT. Message d'erreur générique pour ne pas révéler l'existence du compte.
 */
@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: AppTokenService,
  ) {}

  async execute(email: string, password: string): Promise<LoginResult> {
    const credentials = await this.userRepository.findCredentialsByEmail(email);
    if (!credentials) {
      throw new InvalidCredentialsError();
    }

    if (!credentials.user.verified) {
      throw new EmailNotVerifiedError();
    }

    const ok = await this.passwordHasher.compare(
      password,
      credentials.passwordHash,
    );
    if (!ok) {
      throw new InvalidCredentialsError();
    }

    const token = this.tokenService.sign(toAppJwtClaims(credentials.user));
    return { user: credentials.user, token };
  }
}
