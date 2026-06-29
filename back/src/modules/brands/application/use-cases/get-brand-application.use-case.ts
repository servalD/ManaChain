import { Injectable } from '@nestjs/common';
import { BrandApplication } from '../../domain/brand-application';
import { BrandApplicationRepository } from '../../domain/brand-application.repository';
import { BrandApplicationNotFoundError } from '../../domain/brand.errors';

/** Détail d'une candidature (admin). */
@Injectable()
export class GetBrandApplicationUseCase {
  constructor(
    private readonly applicationRepository: BrandApplicationRepository,
  ) {}

  async execute(id: string): Promise<BrandApplication> {
    const application = await this.applicationRepository.findById(id);
    if (!application) {
      throw new BrandApplicationNotFoundError();
    }
    return application;
  }
}
