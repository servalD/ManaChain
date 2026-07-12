import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Le justificatif d'immatriculation transitait par IPFS (Pinata) — public une
 * fois épinglé, sans contrôle d'accès (cf. COMPLIANCE.md §1.4). Il est
 * désormais stocké en base, lisible uniquement via l'endpoint admin dédié.
 * `brand_application_proof_upload` retient le fichier le temps que le
 * candidat termine le formulaire (avant qu'une ligne `brand_application`
 * n'existe) ; la candidature "consomme" (et supprime) cette ligne temporaire.
 */
export class BrandApplicationRegistrationProofFile1750000000010
  implements MigrationInterface
{
  name = 'BrandApplicationRegistrationProofFile1750000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
ALTER TABLE brand_application
  ADD COLUMN IF NOT EXISTS registration_proof_data BYTEA,
  ADD COLUMN IF NOT EXISTS registration_proof_mime_type TEXT,
  ADD COLUMN IF NOT EXISTS registration_proof_file_name TEXT,
  DROP COLUMN IF EXISTS registration_proof_url;
`);

    await queryRunner.query(`
CREATE TABLE IF NOT EXISTS brand_application_proof_upload (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data BYTEA NOT NULL,
  mime_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_brand_application_proof_upload_created_at ON brand_application_proof_upload(created_at);
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DROP TABLE IF EXISTS brand_application_proof_upload;
`);
    await queryRunner.query(`
ALTER TABLE brand_application
  ADD COLUMN IF NOT EXISTS registration_proof_url TEXT,
  DROP COLUMN IF EXISTS registration_proof_data,
  DROP COLUMN IF EXISTS registration_proof_mime_type,
  DROP COLUMN IF EXISTS registration_proof_file_name;
`);
  }
}
