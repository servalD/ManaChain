import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

/** Persistance de la table `token_holder`. */
@Entity({ name: 'token_holder' })
@Unique(['userId', 'tokenId'])
export class TokenHolderOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  tokenId: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  balance: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
