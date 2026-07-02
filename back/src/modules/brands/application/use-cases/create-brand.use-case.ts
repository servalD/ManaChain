import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../users/domain/user.repository';
import { Brand } from '../../domain/brand';
import { BrandRepository } from '../../domain/brand.repository';
import { InterestChecker } from '../../domain/interest-checker';
import {
  AccountNotVerifiedError,
  BrandNameTakenError,
  InvalidInterestSelectionError,
  UserAlreadyHasBrandError,
} from '../../domain/brand.errors';

export interface CreateBrandInput {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  businessRegistrationNumber?: string | null;
  country: string;
  headquartersStreet: string;
  headquartersCity: string;
  headquartersZipCode: string;
  headquartersAddressComplement?: string | null;
  socialMedias?: Record<string, string> | null;
  interestIds: string[];
}

/**
 * Crée une marque pour l'utilisateur courant (1 marque max), nom unique,
 * 1–2 centres d'intérêt valides. Positionne `is_brand=true` sur le compte.
 */
@Injectable()
export class CreateBrandUseCase {
  constructor(
    private readonly brandRepository: BrandRepository,
    private readonly userRepository: UserRepository,
    private readonly interestChecker: InterestChecker,
  ) {}

  async execute(
    ownerId: string,
    verified: boolean,
    input: CreateBrandInput,
  ): Promise<Brand> {
    if (!verified) {
      throw new AccountNotVerifiedError();
    }
    if (input.interestIds.length < 1 || input.interestIds.length > 2) {
      throw new InvalidInterestSelectionError(
        'Select between 1 and 2 interests',
      );
    }
    if (!(await this.interestChecker.allExist(input.interestIds))) {
      throw new InvalidInterestSelectionError(
        'One or more invalid interest IDs',
      );
    }
    if (await this.brandRepository.existsByOwner(ownerId)) {
      throw new UserAlreadyHasBrandError();
    }
    if (await this.brandRepository.isNameTaken(input.name)) {
      throw new BrandNameTakenError();
    }

    const brand = await this.brandRepository.create({ ownerId, ...input });
    await this.userRepository.setBrandFlag(ownerId, true);
    return brand;
  }
}
