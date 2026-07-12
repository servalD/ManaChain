import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
import { EventTicketPurchase } from '../domain/event-ticket-purchase';
import {
  EventTicketPurchaseRepository,
  RecordEventTicketPurchaseParams,
} from '../domain/event-ticket-purchase.repository';
import { EventTicketPurchaseOrmEntity } from './event-ticket-purchase.orm-entity';

@Injectable()
export class TypeOrmEventTicketPurchaseRepository extends EventTicketPurchaseRepository {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  private get repository(): Repository<EventTicketPurchaseOrmEntity> {
    return this.db.getRepository(EventTicketPurchaseOrmEntity);
  }

  async record(params: RecordEventTicketPurchaseParams): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .insert()
      .values({
        eventId: params.eventId,
        tokenId: params.tokenId,
        buyerAddress: params.buyerAddress,
        userId: params.userId,
        quantity: params.quantity,
        paid: params.paid,
        txHash: params.txHash,
        logIndex: params.logIndex,
      })
      .orIgnore()
      .execute();
  }

  async listByUser(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ purchases: EventTicketPurchase[]; total: number }> {
    const [entities, total] = await this.repository
      .createQueryBuilder('p')
      .where('p.user_id = :userId', { userId })
      .orderBy('p.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
    return { purchases: entities.map((e) => this.toDomain(e)), total };
  }

  private toDomain(e: EventTicketPurchaseOrmEntity): EventTicketPurchase {
    return new EventTicketPurchase(
      e.id,
      e.eventId,
      e.tokenId,
      e.buyerAddress,
      e.userId,
      e.quantity,
      e.paid,
      e.txHash,
      e.logIndex,
      e.createdAt,
    );
  }
}
