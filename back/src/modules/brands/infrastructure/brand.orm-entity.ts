import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Persistance de la table `brand`. Pas de relation ORM interests (liens en SQL). */
@Entity({ name: 'brand' })
export class BrandOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @Column({ type: 'text', unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({ type: 'text', nullable: true })
  websiteUrl: string | null;

  @Column({ type: 'text', nullable: true, unique: true })
  businessRegistrationNumber: string | null;

  @Column({ type: 'text' })
  country: string;

  @Column({ type: 'text' })
  headquartersStreet: string;

  @Column({ type: 'text' })
  headquartersCity: string;

  @Column({ type: 'text' })
  headquartersZipCode: string;

  @Column({ type: 'text', nullable: true })
  headquartersAddressComplement: string | null;

  @Column({ type: 'jsonb', nullable: true })
  socialMedias: Record<string, string> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
