import { EventContracts } from './event-contracts';

export interface CreateEventContractsParams {
  eventTicketsAddress: string;
  brandAddress: string;
  deployTxHash: string;
  blockNumber: bigint;
}

/** Repository PORT de la table `event_contracts`. */
export abstract class EventContractsRepository {
  abstract findByEventTicketsAddress(
    eventTicketsAddress: string,
  ): Promise<EventContracts | null>;
  abstract create(params: CreateEventContractsParams): Promise<EventContracts>;
  abstract setTicketSaleAddress(
    eventTicketsAddress: string,
    ticketSaleAddress: string,
  ): Promise<void>;
  /** Adresses EventTickets déjà connues — surveillées pour `TicketsMinted`. */
  abstract listEventTicketsAddresses(): Promise<string[]>;
  /** Adresses TicketSale déjà connues — surveillées pour `PriceSet`/`Bought`. */
  abstract listTicketSaleAddresses(): Promise<string[]>;
}
