import { Injectable } from '@nestjs/common';
import { Token } from '../../domain/token';
import { TokenRepository } from '../../domain/token.repository';
import { BrandLookup } from '../../domain/brand-lookup';
import {
  InvalidPriceError,
  NotTokenOwnerError,
  TokenNotFoundError,
} from '../../domain/token.errors';

/** Met à jour le prix du token — réservé au propriétaire de la marque. */
@Injectable()
export class UpdateTokenPriceUseCase {
  constructor(
    private readonly tokenRepository: TokenRepository,
    private readonly brandLookup: BrandLookup,
  ) {}

  async execute(
    userId: string,
    tokenId: string,
    price: string,
  ): Promise<Token> {
    if (Number.isNaN(Number(price)) || Number(price) < 0) {
      throw new InvalidPriceError();
    }
    const token = await this.tokenRepository.findById(tokenId);
    if (!token) {
      throw new TokenNotFoundError();
    }
    const ownerId = await this.brandLookup.findOwnerId(token.brandId);
    if (ownerId !== userId) {
      throw new NotTokenOwnerError();
    }
    return this.tokenRepository.updatePrice(tokenId, price);
  }
}
