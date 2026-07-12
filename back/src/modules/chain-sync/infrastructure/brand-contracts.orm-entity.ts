import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Persistance de la table `brand_contracts`. */
@Entity({ name: 'brand_contracts' })
export class BrandContractsOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, unique: true })
  brandId: string | null;

  @Column({ type: 'text', unique: true })
  brandAddress: string;

  @Column({ type: 'text' })
  genesisNftAddress: string;

  @Column({ type: 'text' })
  vaultAddress: string;

  @Column({ type: 'text' })
  supportTokenAddress: string;

  @Column({ type: 'boolean', default: false })
  whitelisted: boolean;

  @Column({ type: 'boolean', default: false })
  blacklisted: boolean;

  @Column({ type: 'text' })
  deployTxHash: string;

  @Column({ type: 'bigint' })
  blockNumber: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
