import { Injectable } from '@nestjs/common';
import { BrandApplication } from '../../domain/brand-application';
import {
  BrandApplicationRepository,
  ListApplicationsParams,
} from '../../domain/brand-application.repository';

/** Liste paginée des candidatures (admin) avec filtres status / search. */
@Injectable()
export class ListBrandApplicationsUseCase {
  constructor(
    private readonly applicationRepository: BrandApplicationRepository,
  ) {}

  execute(
    params: ListApplicationsParams,
  ): Promise<{ applications: BrandApplication[]; total: number }> {
    return this.applicationRepository.list(params);
  }
}
