import { ApiProperty } from '@nestjs/swagger';
import { toIso } from '../../../shared/presentation/date';
import { Event } from '../domain/event';
import { EventTicketType } from '../../chain-sync/domain/event-ticket-type';
import { EventTicketPurchase } from '../../chain-sync/domain/event-ticket-purchase';
import { EventWithBrandName } from '../application/use-cases/list-all-events.use-case';

export class EventResponse {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) brandId: string;
  @ApiProperty() title: string;
  @ApiProperty() type: string;
  @ApiProperty({ type: String, nullable: true }) description: string | null;
  @ApiProperty({ type: String, nullable: true }) addressStreet: string | null;
  @ApiProperty({ type: String, nullable: true }) addressCity: string | null;
  @ApiProperty({ type: String, nullable: true }) addressZipCode: string | null;
  @ApiProperty({ type: String, nullable: true }) addressCountry: string | null;
  @ApiProperty({ type: String, nullable: true }) addressComplement:
    string | null;
  @ApiProperty({ format: 'date-time' }) startsAt: string;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) endsAt:
    string | null;
  @ApiProperty({ type: Number, nullable: true }) maxTickets: number | null;
  @ApiProperty() minTokenBalance: number;
  @ApiProperty() status: string;
  @ApiProperty({ type: String, nullable: true }) coverImageUrl: string | null;
  @ApiProperty({ type: String, nullable: true }) eventTicketsAddress:
    string | null;
  @ApiProperty({ type: String, nullable: true }) ticketSaleAddress:
    string | null;
  @ApiProperty() paymentFree: boolean;
  @ApiProperty({ format: 'date-time' }) createdAt: string;
}

export class PaginatedEventsResponse {
  @ApiProperty({ type: EventResponse, isArray: true }) events: EventResponse[];
  @ApiProperty() total: number;
}

export class AdminEventEntryResponse {
  @ApiProperty({ type: EventResponse }) event: EventResponse;
  @ApiProperty({ type: String, nullable: true }) brandName: string | null;
}

export class PaginatedAdminEventsResponse {
  @ApiProperty({ type: AdminEventEntryResponse, isArray: true })
  events: AdminEventEntryResponse[];
  @ApiProperty() total: number;
}

export class EventTicketTypeResponse {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) eventId: string;
  @ApiProperty() tokenId: string;
  @ApiProperty() price: string;
  @ApiProperty() mintedQuantity: number;
}

export class EventTicketPurchaseResponse {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) eventId: string;
  @ApiProperty() tokenId: string;
  @ApiProperty() buyerAddress: string;
  @ApiProperty() quantity: number;
  @ApiProperty() paid: string;
  @ApiProperty({ format: 'date-time' }) createdAt: string;
}

export class PaginatedTicketPurchasesResponse {
  @ApiProperty({ type: EventTicketPurchaseResponse, isArray: true })
  purchases: EventTicketPurchaseResponse[];
  @ApiProperty() total: number;
}

export const toEventResponse = (e: Event): EventResponse => ({
  id: e.id,
  brandId: e.brandId,
  title: e.title,
  type: e.type,
  description: e.description,
  addressStreet: e.addressStreet,
  addressCity: e.addressCity,
  addressZipCode: e.addressZipCode,
  addressCountry: e.addressCountry,
  addressComplement: e.addressComplement,
  startsAt: toIso(e.startsAt),
  endsAt: toIso(e.endsAt),
  maxTickets: e.maxTickets,
  minTokenBalance: e.minTokenBalance,
  status: e.status,
  coverImageUrl: e.coverImageUrl,
  eventTicketsAddress: e.eventTicketsAddress,
  ticketSaleAddress: e.ticketSaleAddress,
  paymentFree: e.paymentFree,
  createdAt: toIso(e.createdAt),
});

export const toAdminEventEntryResponse = (
  entry: EventWithBrandName,
): AdminEventEntryResponse => ({
  event: toEventResponse(entry.event),
  brandName: entry.brandName,
});

export const toEventTicketTypeResponse = (
  t: EventTicketType,
): EventTicketTypeResponse => ({
  id: t.id,
  eventId: t.eventId,
  tokenId: t.tokenId,
  price: t.price,
  mintedQuantity: t.mintedQuantity,
});

export const toEventTicketPurchaseResponse = (
  p: EventTicketPurchase,
): EventTicketPurchaseResponse => ({
  id: p.id,
  eventId: p.eventId,
  tokenId: p.tokenId,
  buyerAddress: p.buyerAddress,
  quantity: p.quantity,
  paid: p.paid,
  createdAt: toIso(p.createdAt),
});
