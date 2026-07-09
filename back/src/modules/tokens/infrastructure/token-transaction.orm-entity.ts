import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { TokenTransactionType } from '../domain/token-transaction';

/** Persistance de la table `token_transaction` (immuable : pas d'updated_at). */
@Entity({ name: 'token_transaction' })
export class TokenTransactionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tokenId: string;

  @Column({ type: 'uuid', nullable: true })
  fromUserId: string | null;

  @Column({ type: 'uuid', nullable: true })
  toUserId: string | null;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  amount: string;

  @Column({ type: 'text' })
  transactionType: TokenTransactionType;

  /** Prix unitaire à l'achat (null hors `purchase`). */
  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  pricePerToken: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  /** Identité de l'event on-chain source (chain-sync). Null pour les lignes historiques. */
  @Column({ type: 'text', nullable: true })
  txHash: string | null;

  @Column({ type: 'int', nullable: true })
  logIndex: number | null;

  @Column({ type: 'bigint', nullable: true })
  blockNumber: string | null;

  @Column({ type: 'text', nullable: true })
  fromAddress: string | null;

  @Column({ type: 'text', nullable: true })
  toAddress: string | null;
}
