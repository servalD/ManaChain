import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'event_contracts' })
export class EventContractsOrmEntity {
  @PrimaryColumn({ type: 'text' })
  eventTicketsAddress: string;

  @Column({ type: 'text' })
  brandAddress: string;

  @Column({ type: 'text', nullable: true })
  ticketSaleAddress: string | null;

  @Column({ type: 'text' })
  deployTxHash: string;

  @Column({ type: 'bigint' })
  blockNumber: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
