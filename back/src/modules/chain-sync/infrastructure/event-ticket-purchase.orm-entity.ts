import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'event_ticket_purchase' })
export class EventTicketPurchaseOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  eventId: string;

  @Column({ type: 'text' })
  tokenId: string;

  @Column({ type: 'text' })
  buyerAddress: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'numeric', precision: 78, scale: 0, default: 0 })
  paid: string;

  @Column({ type: 'text' })
  txHash: string;

  @Column({ type: 'int' })
  logIndex: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
