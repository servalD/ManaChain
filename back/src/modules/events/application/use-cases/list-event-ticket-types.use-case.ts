import { Injectable } from '@nestjs/common';
import { EventTicketType } from '../../../chain-sync/domain/event-ticket-type';
import { EventTicketTypeRepository } from '../../../chain-sync/domain/event-ticket-type.repository';

/** Types de billets d'un événement (prix + quantité mintée), lecture publique. */
@Injectable()
export class ListEventTicketTypesUseCase {
  constructor(private readonly ticketTypes: EventTicketTypeRepository) {}

  execute(eventId: string): Promise<EventTicketType[]> {
    return this.ticketTypes.listByEvent(eventId);
  }
}
