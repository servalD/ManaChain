import { Injectable } from '@nestjs/common';
import { BrandApplicationProofUploadStore } from '../../domain/brand-application-proof-upload.store';
import { InvalidRegistrationProofFileError } from '../../domain/brand.errors';

const MAX_PROOF_SIZE = 10 * 1024 * 1024;

/**
 * Upload temporaire du justificatif d'immatriculation, avant le dépôt de la
 * candidature (qui n'existe pas encore à ce stade). Retourne un identifiant
 * à passer à `CreateBrandApplicationUseCase`, qui "consomme" ce fichier.
 */
@Injectable()
export class UploadBrandApplicationProofUseCase {
  constructor(private readonly store: BrandApplicationProofUploadStore) {}

  async execute(
    uploadedBy: string,
    file: { buffer: Buffer; filename: string; mimetype: string; size: number },
  ): Promise<string> {
    if (file.mimetype !== 'application/pdf') {
      throw new InvalidRegistrationProofFileError(
        'Only PDF files are accepted',
      );
    }
    if (file.size > MAX_PROOF_SIZE) {
      throw new InvalidRegistrationProofFileError(
        `File size exceeds ${MAX_PROOF_SIZE / (1024 * 1024)}MB limit`,
      );
    }
    return this.store.create(uploadedBy, {
      data: file.buffer,
      mimeType: file.mimetype,
      fileName: file.filename,
    });
  }
}
