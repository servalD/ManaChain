import { Injectable } from '@nestjs/common';
import { BrandContractsRepository } from '../domain/brand-contracts.repository';
import { TokenRepository } from '../../tokens/domain/token.repository';
import { TokenSaleRepository } from '../domain/token-sale.repository';
import { TokenSale } from '../domain/token-sale';

export interface TokenChainInfo {
  supportTokenAddress: string | null;
  vaultAddress: string | null;
  sale: TokenSale | null;
}

/**
 * Enrichissement chaîne d'un `Token` (adresses on-chain + vente en cours),
 * consommé par `GET /tokens/:id` (`TokensController`).
 */
@Injectable()
export class GetTokenChainInfoUseCase {
  constructor(
    private readonly tokenRepository: TokenRepository,
    private readonly brandContracts: BrandContractsRepository,
    private readonly tokenSales: TokenSaleRepository,
  ) {}

  async execute(tokenId: string): Promise<TokenChainInfo> {
    const token = await this.tokenRepository.findById(tokenId);
    if (!token)
      return { supportTokenAddress: null, vaultAddress: null, sale: null };

    const [contracts, sale] = await Promise.all([
      this.brandContracts.findByBrandId(token.brandId),
      this.tokenSales.findByTokenId(tokenId),
    ]);

    return {
      supportTokenAddress: contracts?.supportTokenAddress ?? null,
      vaultAddress: contracts?.vaultAddress ?? null,
      sale,
    };
  }
}
