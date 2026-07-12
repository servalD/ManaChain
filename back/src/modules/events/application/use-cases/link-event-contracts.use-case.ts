import { Injectable } from '@nestjs/common';
import { Event } from '../../domain/event';
import { EventRepository } from '../../domain/event.repository';
import {
  EventContractsNotFoundError,
  EventContractsOwnershipMismatchError,
  EventNotFoundError,
  NotEventOwnerError,
} from '../../domain/event.errors';
import { BrandRepository } from '../../../brands/domain/brand.repository';
import { UserRepository } from '../../../users/domain/user.repository';
import { EventContractsRepository } from '../../../chain-sync/domain/event-contracts.repository';

export interface LinkEventContractsInput {
  eventTicketsAddress: string;
  paymentFree: boolean;
}

/**
 * Lie le module on-chain déployé (`EventModuleDeployed`, observé par
 * chain-sync dans `event_contracts`) au draft DB de l'événement. Vérifie que
 * `event_contracts.brandAddress` correspond au wallet lié de l'appelant (D7)
 * — n'importe qui ne peut pas revendiquer un module déployé par un autre.
 *
 * Idempotent et re-appelable : si `TicketSaleDeployed` n'a pas encore été vu
 * par chain-sync au moment de l'appel, `ticketSaleAddress` reste null tant
 * que le brand ne relie pas à nouveau une fois l'indexeur à jour.
 */
@Injectable()
export class LinkEventContractsUseCase {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly brandRepository: BrandRepository,
    private readonly userRepository: UserRepository,
    private readonly eventContracts: EventContractsRepository,
  ) {}

  async execute(
    callerId: string,
    eventId: string,
    input: LinkEventContractsInput,
  ): Promise<Event> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) throw new EventNotFoundError();

    const brand = await this.brandRepository.findByOwnerId(callerId);
    if (!brand || brand.id !== event.brandId) throw new NotEventOwnerError();

    const user = await this.userRepository.findById(callerId);
    const callerAddress = user?.blockchainAddress?.toLowerCase();

    const contracts = await this.eventContracts.findByEventTicketsAddress(
      input.eventTicketsAddress.toLowerCase(),
    );
    if (!contracts) throw new EventContractsNotFoundError();
    if (!callerAddress || contracts.brandAddress !== callerAddress) {
      throw new EventContractsOwnershipMismatchError();
    }

    return this.eventRepository.linkContracts(eventId, {
      eventTicketsAddress: contracts.eventTicketsAddress,
      ticketSaleAddress: contracts.ticketSaleAddress,
      paymentFree: input.paymentFree,
      deployTxHash: contracts.deployTxHash,
    });
  }
}
