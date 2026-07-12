import { Injectable } from '@nestjs/common';
import { Brand } from '../../domain/brand';
import {
  BrandRepository,
  ListBrandsParams,
} from '../../domain/brand.repository';
import { UserRepository } from '../../../users/domain/user.repository';

export interface BrandWithOwnerAddress {
  brand: Brand;
  ownerBlockchainAddress: string | null;
}

/**
 * Liste des marques avec l'adresse blockchain de leur propriétaire (BRANDUSER),
 * pour l'écran admin de whitelist on-chain — `Brand`/`BrandResponse` n'exposent
 * pas cette donnée (elle vit sur `user`, pas `brand`).
 */
@Injectable()
export class ListBrandsForWhitelistUseCase {
  constructor(
    private readonly brandRepository: BrandRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    params: ListBrandsParams,
  ): Promise<{ brands: BrandWithOwnerAddress[]; total: number }> {
    const { brands, total } = await this.brandRepository.list(params);
    const withAddress = await Promise.all(
      brands.map(async (brand: Brand): Promise<BrandWithOwnerAddress> => {
        const owner = await this.userRepository.findById(brand.ownerId);
        return {
          brand,
          ownerBlockchainAddress: owner?.blockchainAddress ?? null,
        };
      }),
    );
    return { brands: withAddress, total };
  }
}
