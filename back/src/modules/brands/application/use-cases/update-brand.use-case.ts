import { Injectable } from '@nestjs/common';
import { Brand } from '../../domain/brand';
import {
  BrandRepository,
  UpdateBrandFields,
} from '../../domain/brand.repository';
import { InterestChecker } from '../../domain/interest-checker';
import {
  BrandNameTakenError,
  BrandNotFoundError,
  InvalidInterestSelectionError,
  NotBrandOwnerError,
} from '../../domain/brand.errors';

/**
 * Met à jour une marque dont l'utilisateur est propriétaire. Nom unique si
 * changé ; centres d'intérêt (1–2) revalidés si fournis.
 */
@Injectable()
export class UpdateBrandUseCase {
  constructor(
    private readonly brandRepository: BrandRepository,
    private readonly interestChecker: InterestChecker,
  ) {}

  async execute(
    userId: string,
    brandId: string,
    fields: UpdateBrandFields,
    interestIds?: string[],
  ): Promise<Brand> {
    const ownerId = await this.brandRepository.findOwnerId(brandId);
    if (ownerId === null) {
      throw new BrandNotFoundError();
    }
    if (ownerId !== userId) {
      throw new NotBrandOwnerError();
    }
    if (
      fields.name &&
      (await this.brandRepository.isNameTaken(fields.name, brandId))
    ) {
      throw new BrandNameTakenError();
    }
    if (interestIds) {
      if (interestIds.length < 1 || interestIds.length > 2) {
        throw new InvalidInterestSelectionError(
          'Select between 1 and 2 interests',
        );
      }
      if (!(await this.interestChecker.allExist(interestIds))) {
        throw new InvalidInterestSelectionError(
          'One or more invalid interest IDs',
        );
      }
    }
    return this.brandRepository.update(brandId, fields, interestIds);
  }
}
