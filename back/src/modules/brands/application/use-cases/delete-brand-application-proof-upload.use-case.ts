import { Injectable } from '@nestjs/common';
import { BrandApplicationProofUploadStore } from '../../domain/brand-application-proof-upload.store';

/** Annule un justificatif temporairement uploadé (retrait avant dépôt de candidature). */
@Injectable()
export class DeleteBrandApplicationProofUploadUseCase {
  constructor(private readonly store: BrandApplicationProofUploadStore) {}

  async execute(uploadId: string): Promise<void> {
    await this.store.delete(uploadId);
  }
}
