import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandsModule } from '../brands/brands.module';
import { UsersModule } from '../users/users.module';
import { EventOrmEntity } from './infrastructure/event.orm-entity';
import { EventRepository } from './domain/event.repository';
import { TypeOrmEventRepository } from './infrastructure/typeorm-event.repository';
import { CreateEventUseCase } from './application/use-cases/create-event.use-case';
import { ListEventsUseCase } from './application/use-cases/list-events.use-case';
import { GetEventUseCase } from './application/use-cases/get-event.use-case';
import { ListBrandEventsUseCase } from './application/use-cases/list-brand-events.use-case';
import { LinkEventContractsUseCase } from './application/use-cases/link-event-contracts.use-case';
import { PublishEventUseCase } from './application/use-cases/publish-event.use-case';
import { ListEventTicketTypesUseCase } from './application/use-cases/list-event-ticket-types.use-case';
import { ListMyTicketsUseCase } from './application/use-cases/list-my-tickets.use-case';
import { EventsController } from './presentation/events.controller';

/**
 * Module événements (calqué sur `brands`). Les tables chain-sync
 * (`event_contracts`/`event_ticket_type`/`event_ticket_purchase`) sont
 * consommées via les ports globaux de `ChainRegistryModule` — pas d'import
 * de `ChainSyncModule` ici (qui, lui, importera `EventsModule`).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([EventOrmEntity]),
    BrandsModule,
    UsersModule,
  ],
  controllers: [EventsController],
  providers: [
    { provide: EventRepository, useClass: TypeOrmEventRepository },
    CreateEventUseCase,
    ListEventsUseCase,
    GetEventUseCase,
    ListBrandEventsUseCase,
    LinkEventContractsUseCase,
    PublishEventUseCase,
    ListEventTicketTypesUseCase,
    ListMyTicketsUseCase,
  ],
  // Consommé par chain-sync (résolution event.id depuis une adresse on-chain).
  exports: [EventRepository],
})
export class EventsModule {}
