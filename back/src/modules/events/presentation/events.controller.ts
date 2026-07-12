import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { Public } from '../../../shared/decorators/public.decorator';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '../../../shared/enums/role.enum';
import { User } from '../../users/domain/user';
import { CreateEventUseCase } from '../application/use-cases/create-event.use-case';
import { ListEventsUseCase } from '../application/use-cases/list-events.use-case';
import { GetEventUseCase } from '../application/use-cases/get-event.use-case';
import { ListBrandEventsUseCase } from '../application/use-cases/list-brand-events.use-case';
import { LinkEventContractsUseCase } from '../application/use-cases/link-event-contracts.use-case';
import { PublishEventUseCase } from '../application/use-cases/publish-event.use-case';
import { ListEventTicketTypesUseCase } from '../application/use-cases/list-event-ticket-types.use-case';
import { ListMyTicketsUseCase } from '../application/use-cases/list-my-tickets.use-case';
import { CreateEventRequest } from '../application/dto/create-event.request';
import { LinkEventContractsRequest } from '../application/dto/link-event-contracts.request';
import { ListEventsQuery } from '../application/dto/list-events.query';
import {
  EventResponse,
  EventTicketTypeResponse,
  PaginatedEventsResponse,
  PaginatedTicketPurchasesResponse,
  toEventResponse,
  toEventTicketPurchaseResponse,
  toEventTicketTypeResponse,
} from './event.presenter';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly createEvent: CreateEventUseCase,
    private readonly listEvents: ListEventsUseCase,
    private readonly getEvent: GetEventUseCase,
    private readonly listBrandEvents: ListBrandEventsUseCase,
    private readonly linkEventContracts: LinkEventContractsUseCase,
    private readonly publishEvent: PublishEventUseCase,
    private readonly listEventTicketTypes: ListEventTicketTypesUseCase,
    private readonly listMyTickets: ListMyTicketsUseCase,
  ) {}

  @Post()
  @Roles(Role.BRANDUSER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Créer le draft d'un événement" })
  @ApiOkResponse({ type: EventResponse })
  async create(
    @CurrentUser() user: User,
    @Body() body: CreateEventRequest,
  ): Promise<EventResponse> {
    return toEventResponse(await this.createEvent.execute(user.id, body));
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Découverte publique (événements publiés)' })
  @ApiOkResponse({ type: PaginatedEventsResponse })
  async list(
    @Query() query: ListEventsQuery,
  ): Promise<PaginatedEventsResponse> {
    const { events, total } = await this.listEvents.execute(query);
    return { events: events.map(toEventResponse), total };
  }

  // --- Routes spécifiques AVANT /:id ---

  @Get('brand/me')
  @Roles(Role.BRANDUSER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes événements (tous statuts)' })
  @ApiOkResponse({ type: PaginatedEventsResponse })
  async myBrandEvents(
    @CurrentUser() user: User,
    @Query() query: ListEventsQuery,
  ): Promise<PaginatedEventsResponse> {
    const { events, total } = await this.listBrandEvents.execute(
      user.id,
      query,
    );
    return { events: events.map(toEventResponse), total };
  }

  @Get('my/tickets')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes billets achetés' })
  @ApiOkResponse({ type: PaginatedTicketPurchasesResponse })
  async myTickets(
    @CurrentUser() user: User,
    @Query() query: ListEventsQuery,
  ): Promise<PaginatedTicketPurchasesResponse> {
    const { purchases, total } = await this.listMyTickets.execute(
      user.id,
      query.limit,
      query.offset,
    );
    return { purchases: purchases.map(toEventTicketPurchaseResponse), total };
  }

  @Public()
  @Get(':id/ticket-types')
  @ApiOperation({ summary: "Types de billets d'un événement" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: EventTicketTypeResponse, isArray: true })
  async ticketTypes(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EventTicketTypeResponse[]> {
    const types = await this.listEventTicketTypes.execute(id);
    return types.map(toEventTicketTypeResponse);
  }

  @Patch(':id/contracts')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.BRANDUSER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lier le module on-chain déployé au draft' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: EventResponse })
  async linkContracts(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: LinkEventContractsRequest,
  ): Promise<EventResponse> {
    return toEventResponse(
      await this.linkEventContracts.execute(user.id, id, body),
    );
  }

  @Patch(':id/publish')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.BRANDUSER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Publier l'événement" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: EventResponse })
  async publish(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EventResponse> {
    return toEventResponse(await this.publishEvent.execute(user.id, id));
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Événement par id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: EventResponse })
  async getOne(@Param('id', ParseUUIDPipe) id: string): Promise<EventResponse> {
    return toEventResponse(await this.getEvent.execute(id));
  }
}
