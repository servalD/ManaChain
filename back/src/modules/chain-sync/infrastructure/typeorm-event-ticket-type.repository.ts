import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
import { EventTicketType } from '../domain/event-ticket-type';
import { EventTicketTypeRepository } from '../domain/event-ticket-type.repository';
import { EventTicketTypeOrmEntity } from './event-ticket-type.orm-entity';

@Injectable()
export class TypeOrmEventTicketTypeRepository extends EventTicketTypeRepository {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  private get repository(): Repository<EventTicketTypeOrmEntity> {
    return this.db.getRepository(EventTicketTypeOrmEntity);
  }

  async findByEventAndToken(
    eventId: string,
    tokenId: string,
  ): Promise<EventTicketType | null> {
    const entity = await this.repository.findOne({
      where: { eventId, tokenId },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async upsertPrice(
    eventId: string,
    tokenId: string,
    price: string,
  ): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .insert()
      .values({ eventId, tokenId, price })
      .orUpdate(['price'], ['event_id', 'token_id'])
      .execute();
  }

  async increaseMinted(
    eventId: string,
    tokenId: string,
    amount: number,
  ): Promise<void> {
    const existing = await this.findByEventAndToken(eventId, tokenId);
    if (existing) {
      await this.repository.update(
        { eventId, tokenId },
        { mintedQuantity: existing.mintedQuantity + amount },
      );
      return;
    }
    await this.repository
      .createQueryBuilder()
      .insert()
      .values({ eventId, tokenId, mintedQuantity: amount })
      .orIgnore()
      .execute();
  }

  async listByEvent(eventId: string): Promise<EventTicketType[]> {
    const entities = await this.repository.find({ where: { eventId } });
    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(e: EventTicketTypeOrmEntity): EventTicketType {
    return new EventTicketType(
      e.id,
      e.eventId,
      e.tokenId,
      e.price,
      e.mintedQuantity,
      e.createdAt,
      e.updatedAt,
    );
  }
}
