import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Persistance de la table `brand_application_proof_upload` (stockage temporaire). */
@Entity({ name: 'brand_application_proof_upload' })
export class BrandApplicationProofUploadOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bytea' })
  data: Buffer;

  @Column({ type: 'text' })
  mimeType: string;

  @Column({ type: 'text' })
  fileName: string;

  @Column({ type: 'uuid' })
  uploadedBy: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
