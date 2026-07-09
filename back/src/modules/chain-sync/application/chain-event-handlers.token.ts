/** Token DI de la liste assemblée des {@link ChainEventHandler} statiques + dynamiques "token". */
export const CHAIN_EVENT_HANDLERS = Symbol('CHAIN_EVENT_HANDLERS');

/**
 * Token DI des handlers du groupe dynamique "ticket" (`TicketSale`/`EventTickets`),
 * dispatché séparément — `TicketSale.Bought` partage son nom avec
 * `TokenSaleEscrow.Bought`, les deux ne peuvent pas cohabiter dans une seule map.
 */
export const TICKET_EVENT_HANDLERS = Symbol('TICKET_EVENT_HANDLERS');
