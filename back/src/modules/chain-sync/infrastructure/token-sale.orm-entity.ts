import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { TokenSaleStatus } from '../domain/token-sale';

/** Persistance de la table `token_sale`. Montants en unités brutes on-chain (NUMERIC(78,0)). */
@Entity({ name: 'token_sale' })
export class TokenSaleOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  tokenId: string;

  @Column({ type: 'text', unique: true })
  escrowAddress: string;

  @Column({ type: 'numeric', precision: 78, scale: 0 })
  pricePerToken: string;

  @Column({ type: 'numeric', precision: 78, scale: 0 })
  totalForSale: string;

  @Column({ type: 'numeric', precision: 78, scale: 0, default: 0 })
  soldAmount: string;

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz' })
  endTime: Date;

  @Column({ type: 'text', default: 'open' })
  status: TokenSaleStatus;

  @Column({ type: 'text' })
  deployTxHash: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
