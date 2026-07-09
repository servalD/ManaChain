import { Event } from './event';

export interface CreateEventParams {
  brandId: string;
  title: string;
  type: string;
  description?: string | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressZipCode?: string | null;
  addressCountry?: string | null;
  addressComplement?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  maxTickets?: number | null;
  minTokenBalance?: number;
  coverImageUrl?: string | null;
}

export interface ListEventsParams {
  limit: number;
  offset: number;
  search?: string;
}

/** Repository PORT de la table `event` (module events). */
export abstract class EventRepository {
  abstract findById(id: string): Promise<Event | null>;
  abstract findOwnerId(id: string): Promise<string | null>;
  /** Résolution event.id depuis une adresse on-chain (consommé par chain-sync). */
  abstract findByEventTicketsAddress(
    eventTicketsAddress: string,
  ): Promise<Event | null>;
  abstract findByTicketSaleAddress(
    ticketSaleAddress: string,
  ): Promise<Event | null>;
  /** Marques publiées uniquement (découverte publique). */
  abstract listPublished(
    params: ListEventsParams,
  ): Promise<{ events: Event[]; total: number }>;
  abstract listByBrand(
    brandId: string,
    params: ListEventsParams,
  ): Promise<{ events: Event[]; total: number }>;
  abstract create(params: CreateEventParams): Promise<Event>;
  /** Renseigne les adresses on-chain après déploiement (`link-event-contracts`). */
  abstract linkContracts(
    id: string,
    fields: {
      eventTicketsAddress: string;
      ticketSaleAddress?: string | null;
      paymentFree: boolean;
      deployTxHash: string;
    },
  ): Promise<Event>;
  abstract publish(id: string): Promise<Event>;
}
