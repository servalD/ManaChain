import { Injectable } from '@nestjs/common';
import { Brand } from '../../domain/brand';
import {
  BrandRepository,
  ListBrandsParams,
} from '../../domain/brand.repository';

/**
 * Liste paginée des marques (public) avec filtres search / interestId /
 * excludeBrandIds. Utilisé aussi par l'endpoint admin "active" (les bans seront
 * branchés au jalon dédié — stub pour l'instant).
 */
@Injectable()
export class ListBrandsUseCase {
  constructor(private readonly brandRepository: BrandRepository) {}

  execute(
    params: ListBrandsParams,
  ): Promise<{ brands: Brand[]; total: number }> {
    return this.brandRepository.list(params);
  }
}
