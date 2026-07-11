import { Injectable } from '@nestjs/common';
import { RefreshTokenRepository } from '../../domain/refresh-token.repository';

/** Révoque un refresh token. Idempotent : un jeton déjà révoqué ou inconnu n'est pas une erreur. */
@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.revoke(refreshToken);
  }
}
