import { Injectable } from '@nestjs/common';
import { ChainEventHandler } from '../../domain/chain-event-handler';
import { DecodedLog } from '../../domain/chain-reader';
import { EventTicketTypeRepository } from '../../domain/event-ticket-type.repository';
import { EventRepository } from '../../../events/domain/event.repository';
import { TransactionRunner } from '../../../../shared/application/transaction-runner';

/**
 * `TicketsMinted` (EventTickets) : incrémente `event_ticket_type.mintedQuantity`
 * uniquement quand `to == ticketSale` (mint de stock vendable, pas un mint
 * incident vers une autre adresse). `log.address` EST l'eventTickets.
 */
@Injectable()
export class TicketsMintedHandler implements ChainEventHandler {
  readonly eventName = 'TicketsMinted';

  constructor(
    private readonly eventRepository: EventRepository,
    private readonly ticketTypes: EventTicketTypeRepository,
    private readonly tx: TransactionRunner,
  ) {}

  async handle(log: DecodedLog): Promise<void> {
    const eventTicketsAddress = log.address.toLowerCase();
    const to = (log.args.to as string).toLowerCase();
    const event =
      await this.eventRepository.findByEventTicketsAddress(eventTicketsAddress);
    if (!event?.ticketSaleAddress || to !== event.ticketSaleAddress) return;

    const tokenId = (log.args.tokenId as bigint).toString();
    const amount = Number(log.args.amount);
    await this.tx.run(() =>
      this.ticketTypes.increaseMinted(event.id, tokenId, amount),
    );
  }
}
