import { Injectable, Logger } from '@nestjs/common';
import { ChainEventHandler } from '../../domain/chain-event-handler';
import { DecodedLog } from '../../domain/chain-reader';
import { EventTicketTypeRepository } from '../../domain/event-ticket-type.repository';
import { EventRepository } from '../../../events/domain/event.repository';
import { TransactionRunner } from '../../../../shared/application/transaction-runner';

/** `PriceSet` (TicketSale) : upsert `event_ticket_type.price`. `log.address` EST le ticketSale. */
@Injectable()
export class PriceSetHandler implements ChainEventHandler {
  readonly eventName = 'PriceSet';
  private readonly logger = new Logger(PriceSetHandler.name);

  constructor(
    private readonly eventRepository: EventRepository,
    private readonly ticketTypes: EventTicketTypeRepository,
    private readonly tx: TransactionRunner,
  ) {}

  async handle(log: DecodedLog): Promise<void> {
    const ticketSaleAddress = log.address.toLowerCase();
    const event =
      await this.eventRepository.findByTicketSaleAddress(ticketSaleAddress);
    if (!event) {
      this.logger.warn(
        `PriceSet on unknown ticket sale ${ticketSaleAddress} — skipped`,
      );
      return;
    }

    const tokenId = (log.args.tokenId as bigint).toString();
    const price = (log.args.price as bigint).toString();
    await this.tx.run(() =>
      this.ticketTypes.upsertPrice(event.id, tokenId, price),
    );
  }
}
