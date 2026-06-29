import { Injectable } from '@nestjs/common';
import { BrandMedia } from '../../domain/brand-media';
import { BrandMediaRepository } from '../../domain/brand-media.repository';

/** Liste les médias d'une marque (public), triés par display_order. */
@Injectable()
export class ListBrandMediaUseCase {
  constructor(private readonly mediaRepository: BrandMediaRepository) {}

  execute(brandId: string): Promise<BrandMedia[]> {
    return this.mediaRepository.findByBrand(brandId);
  }
}
