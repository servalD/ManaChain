import { Injectable } from '@nestjs/common';
import { BrandRepository } from '../../domain/brand.repository';
import { BrandNotFoundError } from '../../domain/brand.errors';
import {
  BrandEngagementHistoryReader,
  EngagementPoint,
} from '../../domain/brand-engagement-history.reader';

/** Historique (holders + likes cumulés, jour par jour) pour les charts du dashboard marque. */
@Injectable()
export class GetBrandEngagementHistoryUseCase {
  constructor(
    private readonly brandRepository: BrandRepository,
    private readonly historyReader: BrandEngagementHistoryReader,
  ) {}

  async execute(brandId: string, days: number): Promise<EngagementPoint[]> {
    const brand = await this.brandRepository.findById(brandId);
    if (!brand) {
      throw new BrandNotFoundError();
    }
    return this.historyReader.getHistory(brandId, days);
  }
}
