import { TokenSale, TokenSaleStatus } from './token-sale';

export interface CreateTokenSaleParams {
  tokenId: string;
  escrowAddress: string;
  pricePerToken: string;
  totalForSale: string;
  startTime: Date;
  endTime: Date;
  deployTxHash: string;
}

/** Repository PORT de la table `token_sale`. */
export abstract class TokenSaleRepository {
  abstract findByEscrowAddress(
    escrowAddress: string,
  ): Promise<TokenSale | null>;
  abstract findByTokenId(tokenId: string): Promise<TokenSale | null>;
  abstract create(params: CreateTokenSaleParams): Promise<TokenSale>;
  /** Incrémente `sold_amount` (unités brutes, addition en string côté adapter). */
  abstract increaseSold(escrowAddress: string, amount: string): Promise<void>;
  abstract setStatus(
    escrowAddress: string,
    status: TokenSaleStatus,
  ): Promise<void>;
  /** Adresses d'escrow déjà connues — surveillées pour `Bought`/`RefundClaimed`/statut. */
  abstract listAllEscrowAddresses(): Promise<string[]>;
}
