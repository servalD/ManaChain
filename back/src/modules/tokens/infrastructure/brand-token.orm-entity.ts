import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Persistance de la table `brand_token`. Les décimaux sont des chaînes côté pg. */
@Entity({ name: 'brand_token' })
export class BrandTokenOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  brandId: string;

  @Column({ type: 'text', unique: true })
  symbol: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  totalSupply: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  currentPrice: string;

  @Column({ type: 'text', nullable: true })
  nftTokenId: string | null;

  @Column({ type: 'text', nullable: true })
  nftName: string | null;

  @Column({ type: 'text', nullable: true })
  nftSymbol: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
