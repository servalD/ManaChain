import { Token } from './token';

export interface CreateTokenParams {
  brandId: string;
  symbol: string;
  totalSupply: number;
  currentPrice: string;
  nftTokenId?: string | null;
  nftName?: string | null;
  nftSymbol?: string | null;
}

/** Repository PORT de la table `brand_token`. */
export abstract class TokenRepository {
  abstract findById(id: string): Promise<Token | null>;
  abstract findByBrandId(brandId: string): Promise<Token | null>;
  abstract existsByBrandId(brandId: string): Promise<boolean>;
  abstract isSymbolTaken(symbol: string): Promise<boolean>;
  abstract create(params: CreateTokenParams): Promise<Token>;
  abstract updatePrice(tokenId: string, price: string): Promise<Token>;
  abstract increaseSupply(tokenId: string, amount: number): Promise<void>;
}
