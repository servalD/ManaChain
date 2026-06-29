import { Injectable } from '@nestjs/common';
import { Token } from '../../domain/token';
import { TokenRepository } from '../../domain/token.repository';
import { TokenNotFoundError } from '../../domain/token.errors';

/** Récupère un token par son id (public). */
@Injectable()
export class GetTokenUseCase {
  constructor(private readonly tokenRepository: TokenRepository) {}

  async execute(id: string): Promise<Token> {
    const token = await this.tokenRepository.findById(id);
    if (!token) throw new TokenNotFoundError();
    return token;
  }
}
