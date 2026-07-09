import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** Persistance de la table `chain_sync_cursor`. */
@Entity({ name: 'chain_sync_cursor' })
export class ChainSyncCursorOrmEntity {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'bigint', default: 0 })
  lastProcessedBlock: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
