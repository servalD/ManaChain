export interface ProofUploadFile {
  data: Buffer;
  mimeType: string;
  fileName: string;
}

/**
 * Stockage temporaire d'un justificatif d'immatriculation uploadé avant que
 * la candidature (`brand_application`) n'existe encore. `consume` récupère
 * le fichier et supprime la ligne temporaire (usage unique).
 */
export abstract class BrandApplicationProofUploadStore {
  abstract create(uploadedBy: string, file: ProofUploadFile): Promise<string>;
  abstract consume(uploadId: string): Promise<ProofUploadFile | null>;
  abstract delete(uploadId: string): Promise<boolean>;
  /** Purge les uploads jamais rattachés à une candidature (formulaire abandonné). */
  abstract deleteOlderThan(cutoff: Date): Promise<number>;
}
