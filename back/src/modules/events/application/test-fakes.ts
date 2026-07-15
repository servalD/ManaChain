import { randomUUID } from 'node:crypto';
import { Event, EventStatus } from '../domain/event';
import { CreateEventParams, EventRepository } from '../domain/event.repository';
import { EventNotFoundError } from '../domain/event.errors';

export { FakeTransactionRunner } from '../../../shared/application/test-fakes';

export class InMemoryEventRepository extends EventRepository {
  private readonly rows = new Map<string, Event>();

  seed(partial: Partial<Event> & { id?: string } = {}): Event {
    const now = new Date();
    const row = new Event(
      partial.id ?? randomUUID(),
      partial.brandId ?? randomUUID(),
      partial.title ?? 'Event',
      partial.type ?? 'meetup',
      partial.description ?? null,
      partial.addressStreet ?? null,
      partial.addressCity ?? null,
      partial.addressZipCode ?? null,
      partial.addressCountry ?? null,
      partial.addressComplement ?? null,
      partial.startsAt ?? now,
      partial.endsAt ?? null,
      partial.maxTickets ?? null,
      partial.minTokenBalance ?? 0,
      (partial.status as EventStatus) ?? 'draft',
      partial.coverImageUrl ?? null,
      partial.eventTicketsAddress ?? null,
      partial.ticketSaleAddress ?? null,
      partial.paymentFree ?? false,
      partial.deployTxHash ?? null,
      partial.createdAt ?? now,
      partial.updatedAt ?? now,
    );
    this.rows.set(row.id, row);
    return row;
  }

  findById(id: string): Promise<Event | null> {
    return Promise.resolve(this.rows.get(id) ?? null);
  }
  findOwnerId(id: string): Promise<string | null> {
    return Promise.resolve(this.rows.get(id)?.brandId ?? null);
  }
  findByEventTicketsAddress(
    eventTicketsAddress: string,
  ): Promise<Event | null> {
    return Promise.resolve(
      [...this.rows.values()].find(
        (e) => e.eventTicketsAddress === eventTicketsAddress,
      ) ?? null,
    );
  }
  findByTicketSaleAddress(ticketSaleAddress: string): Promise<Event | null> {
    return Promise.resolve(
      [...this.rows.values()].find(
        (e) => e.ticketSaleAddress === ticketSaleAddress,
      ) ?? null,
    );
  }
  listPublished(): Promise<{ events: Event[]; total: number }> {
    const events = [...this.rows.values()].filter(
      (e) => e.status === 'published',
    );
    return Promise.resolve({ events, total: events.length });
  }
  listByBrand(brandId: string): Promise<{ events: Event[]; total: number }> {
    const events = [...this.rows.values()].filter((e) => e.brandId === brandId);
    return Promise.resolve({ events, total: events.length });
  }
  listAll(): Promise<{ events: Event[]; total: number }> {
    const events = [...this.rows.values()];
    return Promise.resolve({ events, total: events.length });
  }
  create(params: CreateEventParams): Promise<Event> {
    return Promise.resolve(
      this.seed({
        brandId: params.brandId,
        title: params.title,
        type: params.type,
        description: params.description ?? null,
        startsAt: params.startsAt,
        endsAt: params.endsAt ?? null,
        maxTickets: params.maxTickets ?? null,
        minTokenBalance: params.minTokenBalance ?? 0,
        coverImageUrl: params.coverImageUrl ?? null,
      }),
    );
  }
  linkContracts(
    id: string,
    fields: {
      eventTicketsAddress: string;
      ticketSaleAddress?: string | null;
      paymentFree: boolean;
      deployTxHash: string;
    },
  ): Promise<Event> {
    const e = this.rows.get(id);
    if (!e) throw new EventNotFoundError();
    return Promise.resolve(
      this.seed({
        ...e,
        eventTicketsAddress: fields.eventTicketsAddress,
        ticketSaleAddress: fields.ticketSaleAddress ?? null,
        paymentFree: fields.paymentFree,
        deployTxHash: fields.deployTxHash,
      }),
    );
  }
  publish(id: string): Promise<Event> {
    const e = this.rows.get(id);
    if (!e) throw new EventNotFoundError();
    return Promise.resolve(this.seed({ ...e, status: 'published' }));
  }
  cancel(id: string): Promise<Event> {
    const e = this.rows.get(id);
    if (!e) throw new EventNotFoundError();
    return Promise.resolve(this.seed({ ...e, status: 'cancelled' }));
  }
}
