import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { EventStatus } from '../domain/event';

/** Persistance de la table `event` (colonnes legacy `ticket_price`/`ticket_currency`/
 * `nft_collection_contract_address` non mappées ici — inutilisées par ce module). */
@Entity({ name: 'event' })
export class EventOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  brandId: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  addressStreet: string | null;

  @Column({ type: 'text', nullable: true })
  addressCity: string | null;

  @Column({ type: 'text', nullable: true })
  addressZipCode: string | null;

  @Column({ type: 'text', nullable: true })
  addressCountry: string | null;

  @Column({ type: 'text', nullable: true })
  addressComplement: string | null;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endsAt: Date | null;

  @Column({ type: 'int', nullable: true })
  maxTickets: number | null;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  minTokenBalance: string;

  @Column({ type: 'text', default: 'draft' })
  status: EventStatus;

  @Column({ type: 'text', nullable: true })
  coverImageUrl: string | null;

  @Column({ type: 'text', nullable: true })
  eventTicketsAddress: string | null;

  @Column({ type: 'text', nullable: true })
  ticketSaleAddress: string | null;

  @Column({ type: 'boolean', default: false })
  paymentFree: boolean;

  @Column({ type: 'text', nullable: true })
  deployTxHash: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
