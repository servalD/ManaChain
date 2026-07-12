import { Injectable } from '@nestjs/common';
import { ChainEventHandler } from '../../domain/chain-event-handler';
import { DecodedLog } from '../../domain/chain-reader';
import { EventContractsRepository } from '../../domain/event-contracts.repository';
import { TransactionRunner } from '../../../../shared/application/transaction-runner';

/** `TicketSaleDeployed` (SaleFactory) : renseigne `event_contracts.ticketSaleAddress`. */
@Injectable()
export class TicketSaleDeployedHandler implements ChainEventHandler {
  readonly eventName = 'TicketSaleDeployed';

  constructor(
    private readonly eventContracts: EventContractsRepository,
    private readonly tx: TransactionRunner,
  ) {}

  async handle(log: DecodedLog): Promise<void> {
    const eventTicketsAddress = (log.args.eventTickets as string).toLowerCase();
    const contracts =
      await this.eventContracts.findByEventTicketsAddress(eventTicketsAddress);
    if (!contracts || contracts.ticketSaleAddress) return; // pas encore découvert, ou déjà fait

    const ticketSaleAddress = (log.args.ticketSale as string).toLowerCase();
    await this.tx.run(() =>
      this.eventContracts.setTicketSaleAddress(
        eventTicketsAddress,
        ticketSaleAddress,
      ),
    );
  }
}
