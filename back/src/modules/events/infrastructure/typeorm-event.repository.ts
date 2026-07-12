import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
import { Event } from '../domain/event';
import {
  CreateEventParams,
  EventRepository,
  ListEventsParams,
} from '../domain/event.repository';
import { EventNotFoundError } from '../domain/event.errors';
import { EventOrmEntity } from './event.orm-entity';

@Injectable()
export class TypeOrmEventRepository extends EventRepository {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  private get repository(): Repository<EventOrmEntity> {
    return this.db.getRepository(EventOrmEntity);
  }

  async findById(id: string): Promise<Event | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findOwnerId(id: string): Promise<string | null> {
    return (await this.repository.findOne({ where: { id } }))?.brandId ?? null;
  }

  async findByEventTicketsAddress(
    eventTicketsAddress: string,
  ): Promise<Event | null> {
    const entity = await this.repository.findOne({
      where: { eventTicketsAddress },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByTicketSaleAddress(
    ticketSaleAddress: string,
  ): Promise<Event | null> {
    const entity = await this.repository.findOne({
      where: { ticketSaleAddress },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async listPublished(
    params: ListEventsParams,
  ): Promise<{ events: Event[]; total: number }> {
    const qb = this.repository
      .createQueryBuilder('e')
      .where('e.status = :status', { status: 'published' });
    if (params.search) {
      qb.andWhere('e.title ILIKE :search', { search: `%${params.search}%` });
    }
    qb.orderBy('e.starts_at', 'ASC').skip(params.offset).take(params.limit);
    const [entities, total] = await qb.getManyAndCount();
    return { events: entities.map((e) => this.toDomain(e)), total };
  }

  async listByBrand(
    brandId: string,
    params: ListEventsParams,
  ): Promise<{ events: Event[]; total: number }> {
    const [entities, total] = await this.repository
      .createQueryBuilder('e')
      .where('e.brand_id = :brandId', { brandId })
      .orderBy('e.created_at', 'DESC')
      .skip(params.offset)
      .take(params.limit)
      .getManyAndCount();
    return { events: entities.map((e) => this.toDomain(e)), total };
  }

  async create(params: CreateEventParams): Promise<Event> {
    const saved = await this.repository.save(
      this.repository.create({
        brandId: params.brandId,
        title: params.title,
        type: params.type,
        description: params.description ?? null,
        addressStreet: params.addressStreet ?? null,
        addressCity: params.addressCity ?? null,
        addressZipCode: params.addressZipCode ?? null,
        addressCountry: params.addressCountry ?? null,
        addressComplement: params.addressComplement ?? null,
        startsAt: params.startsAt,
        endsAt: params.endsAt ?? null,
        maxTickets: params.maxTickets ?? null,
        minTokenBalance: String(params.minTokenBalance ?? 0),
        coverImageUrl: params.coverImageUrl ?? null,
      }),
    );
    return this.toDomain(saved);
  }

  async linkContracts(
    id: string,
    fields: {
      eventTicketsAddress: string;
      ticketSaleAddress?: string | null;
      paymentFree: boolean;
      deployTxHash: string;
    },
  ): Promise<Event> {
    await this.repository.update(
      { id },
      {
        eventTicketsAddress: fields.eventTicketsAddress,
        ticketSaleAddress: fields.ticketSaleAddress ?? null,
        paymentFree: fields.paymentFree,
        deployTxHash: fields.deployTxHash,
      },
    );
    return this.getOrThrow(id);
  }

  async publish(id: string): Promise<Event> {
    await this.repository.update({ id }, { status: 'published' });
    return this.getOrThrow(id);
  }

  private async getOrThrow(id: string): Promise<Event> {
    const event = await this.findById(id);
    if (!event) throw new EventNotFoundError();
    return event;
  }

  private toDomain(e: EventOrmEntity): Event {
    return new Event(
      e.id,
      e.brandId,
      e.title,
      e.type,
      e.description,
      e.addressStreet,
      e.addressCity,
      e.addressZipCode,
      e.addressCountry,
      e.addressComplement,
      e.startsAt,
      e.endsAt,
      e.maxTickets,
      Number(e.minTokenBalance),
      e.status,
      e.coverImageUrl,
      e.eventTicketsAddress,
      e.ticketSaleAddress,
      e.paymentFree,
      e.deployTxHash,
      e.createdAt,
      e.updatedAt,
    );
  }
}
