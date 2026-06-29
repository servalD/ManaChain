import { Injectable } from '@nestjs/common';
import { Token } from '../../domain/token';
import { TokenRepository } from '../../domain/token.repository';
import { TokenNotFoundError } from '../../domain/token.errors';

/** Récupère le token d'une marque (public). */
@Injectable()
export class GetTokenByBrandUseCase {
  constructor(private readonly tokenRepository: TokenRepository) {}

  async execute(brandId: string): Promise<Token> {
    const token = await this.tokenRepository.findByBrandId(brandId);
    if (!token) throw new TokenNotFoundError();
    return token;
  }
}
