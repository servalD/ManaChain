import { Injectable } from '@nestjs/common';
import { ChainEventHandler } from '../../domain/chain-event-handler';
import { DecodedLog } from '../../domain/chain-reader';
import { EventContractsRepository } from '../../domain/event-contracts.repository';
import { TransactionRunner } from '../../../../shared/application/transaction-runner';

/** `EventModuleDeployed` (EventFactory) : enregistre `event_contracts`. */
@Injectable()
export class EventModuleDeployedHandler implements ChainEventHandler {
  readonly eventName = 'EventModuleDeployed';

  constructor(
    private readonly eventContracts: EventContractsRepository,
    private readonly tx: TransactionRunner,
  ) {}

  async handle(log: DecodedLog): Promise<void> {
    const eventTicketsAddress = (log.args.eventTickets as string).toLowerCase();
    if (
      await this.eventContracts.findByEventTicketsAddress(eventTicketsAddress)
    )
      return;

    const brandAddress = (log.args.brand as string).toLowerCase();
    await this.tx.run(() =>
      this.eventContracts.create({
        eventTicketsAddress,
        brandAddress,
        deployTxHash: log.transactionHash,
        blockNumber: log.blockNumber,
      }),
    );
  }
}
