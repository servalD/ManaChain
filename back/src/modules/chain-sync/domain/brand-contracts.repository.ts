import { BrandContracts } from './brand-contracts';

export interface CreateBrandContractsParams {
  brandId: string | null;
  brandAddress: string;
  genesisNftAddress: string;
  vaultAddress: string;
  supportTokenAddress: string;
  deployTxHash: string;
  blockNumber: bigint;
}

/** Repository PORT de la table `brand_contracts`. */
export abstract class BrandContractsRepository {
  abstract findByBrandAddress(
    brandAddress: string,
  ): Promise<BrandContracts | null>;
  abstract findByBrandId(brandId: string): Promise<BrandContracts | null>;
  abstract findBySupportTokenAddress(
    supportTokenAddress: string,
  ): Promise<BrandContracts | null>;
  abstract create(params: CreateBrandContractsParams): Promise<BrandContracts>;
  abstract linkBrand(brandAddress: string, brandId: string): Promise<void>;
  abstract setWhitelisted(
    brandAddress: string,
    whitelisted: boolean,
  ): Promise<void>;
  abstract setBlacklisted(
    brandAddress: string,
    blacklisted: boolean,
  ): Promise<void>;
  /** Adresses des support tokens déjà connus — surveillées pour leurs events `Transfer` ERC-20. */
  abstract listSupportTokenAddresses(): Promise<string[]>;
}
