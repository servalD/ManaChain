import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { BrandApplicationStatus } from '../domain/brand-application';

/** Persistance de la table `brand_application`. */
@Entity({ name: 'brand_application' })
export class BrandApplicationOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  contactEmail: string;

  @Column({ type: 'text' })
  contactFirstName: string;

  @Column({ type: 'text' })
  contactLastName: string;

  @Column({ type: 'text', nullable: true })
  contactPhone: string | null;

  @Column({ type: 'text' })
  brandName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  websiteUrl: string | null;

  @Column({ type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({ type: 'text' })
  businessRegistrationNumber: string;

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

  @Column({ type: 'text', nullable: true })
  motivation: string | null;

  @Column({ type: 'int', nullable: true })
  estimatedCommunitySize: number | null;

  @Column({ type: 'jsonb', nullable: true })
  socialMediaLinks: Record<string, string> | null;

  @Column({ type: 'text', nullable: true })
  howDidYouHearAboutUs: string | null;

  @Column({ type: 'text', nullable: true })
  registrationProofUrl: string | null;

  @Column({ type: 'text', default: 'pending' })
  status: BrandApplicationStatus;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'text', nullable: true })
  emailVerificationToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerificationExpires: Date | null;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
