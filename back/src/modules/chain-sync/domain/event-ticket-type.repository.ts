import { EventTicketType } from './event-ticket-type';

/** Repository PORT de la table `event_ticket_type`. */
export abstract class EventTicketTypeRepository {
  abstract findByEventAndToken(
    eventId: string,
    tokenId: string,
  ): Promise<EventTicketType | null>;
  abstract upsertPrice(
    eventId: string,
    tokenId: string,
    price: string,
  ): Promise<void>;
  abstract increaseMinted(
    eventId: string,
    tokenId: string,
    amount: number,
  ): Promise<void>;
  abstract listByEvent(eventId: string): Promise<EventTicketType[]>;
}
