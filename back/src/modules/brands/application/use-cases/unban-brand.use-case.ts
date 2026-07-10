import { Injectable } from '@nestjs/common';
import { BrandBanRepository } from '../../domain/brand-ban.repository';

@Injectable()
export class UnbanBrandUseCase {
  constructor(private readonly brandBans: BrandBanRepository) {}

  execute(brandId: string): Promise<void> {
    return this.brandBans.revoke(brandId);
  }
}
