import { Injectable } from '@nestjs/common';
import { Event } from '../../domain/event';
import {
  EventRepository,
  ListEventsParams,
} from '../../domain/event.repository';
import { BrandRepository } from '../../../brands/domain/brand.repository';

export interface EventWithBrandName {
  event: Event;
  brandName: string | null;
}

/**
 * Liste admin : tous statuts, toutes marques — modération. `Event` n'expose
 * pas le nom de la marque (il vit sur `brand`, pas `event`).
 */
@Injectable()
export class ListAllEventsUseCase {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly brandRepository: BrandRepository,
  ) {}

  async execute(
    params: ListEventsParams,
  ): Promise<{ events: EventWithBrandName[]; total: number }> {
    const { events, total } = await this.eventRepository.listAll(params);
    const withBrandName = await Promise.all(
      events.map(async (event: Event): Promise<EventWithBrandName> => {
        const brand = await this.brandRepository.findById(event.brandId);
        return { event, brandName: brand?.name ?? null };
      }),
    );
    return { events: withBrandName, total };
  }
}
