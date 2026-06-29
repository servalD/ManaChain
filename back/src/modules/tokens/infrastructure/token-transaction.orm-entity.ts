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

  @Column({ type: 'uuid' })
  toUserId: string;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  amount: string;

  @Column({ type: 'text' })
  transactionType: TokenTransactionType;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
