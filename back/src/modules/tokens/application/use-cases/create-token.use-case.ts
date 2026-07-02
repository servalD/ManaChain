import { Injectable } from '@nestjs/common';
import { Token } from '../../domain/token';
import { TokenRepository } from '../../domain/token.repository';
import { BrandLookup } from '../../domain/brand-lookup';
import {
  AccountNotVerifiedError,
  BrandAlreadyHasTokenError,
  BrandRequiredError,
  InvalidPriceError,
  TokenSymbolTakenError,
} from '../../domain/token.errors';

export interface CreateTokenInput {
  symbol: string;
  totalSupply?: number;
  currentPrice?: string;
  nftTokenId?: string | null;
  nftName?: string | null;
  nftSymbol?: string | null;
}

/**
 * Crée le token de la marque de l'utilisateur courant (1 token par marque,
 * symbole unique). L'utilisateur DOIT posséder une marque.
 */
@Injectable()
export class CreateTokenUseCase {
  constructor(
    private readonly tokenRepository: TokenRepository,
    private readonly brandLookup: BrandLookup,
  ) {}

  async execute(
    ownerId: string,
    verified: boolean,
    input: CreateTokenInput,
  ): Promise<Token> {
    if (!verified) {
      throw new AccountNotVerifiedError();
    }
    const brandId = await this.brandLookup.findBrandIdByOwner(ownerId);
    if (!brandId) {
      throw new BrandRequiredError();
    }
    if (await this.tokenRepository.existsByBrandId(brandId)) {
      throw new BrandAlreadyHasTokenError();
    }
    const symbol = input.symbol.toUpperCase();
    if (await this.tokenRepository.isSymbolTaken(symbol)) {
      throw new TokenSymbolTakenError();
    }
    const currentPrice = input.currentPrice ?? '0';
    if (Number.isNaN(Number(currentPrice)) || Number(currentPrice) < 0) {
      throw new InvalidPriceError();
    }

    return this.tokenRepository.create({
      brandId,
      symbol,
      totalSupply: input.totalSupply ?? 0,
      currentPrice,
      nftTokenId: input.nftTokenId,
      nftName: input.nftName,
      nftSymbol: input.nftSymbol,
    });
  }
}
