import { Injectable } from '@nestjs/common';
import {
  BrandApplicationRepository,
  RegistrationProofFile,
} from '../../domain/brand-application.repository';
import {
  BrandApplicationNotFoundError,
  RegistrationProofNotFoundError,
} from '../../domain/brand.errors';

/** Téléchargement du justificatif d'immatriculation (admin uniquement). */
@Injectable()
export class GetBrandApplicationRegistrationProofUseCase {
  constructor(
    private readonly applicationRepository: BrandApplicationRepository,
  ) {}

  async execute(applicationId: string): Promise<RegistrationProofFile> {
    const application =
      await this.applicationRepository.findById(applicationId);
    if (!application) {
      throw new BrandApplicationNotFoundError();
    }
    const proof =
      await this.applicationRepository.findRegistrationProofFile(
        applicationId,
      );
    if (!proof) {
      throw new RegistrationProofNotFoundError();
    }
    return proof;
  }
}
