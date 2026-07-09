import { Injectable } from '@nestjs/common';
import { Event } from '../../domain/event';
import {
  EventRepository,
  ListEventsParams,
} from '../../domain/event.repository';
import { BrandRequiredError } from '../../domain/event.errors';
import { BrandRepository } from '../../../brands/domain/brand.repository';

/** Tous les événements de la marque de l'appelant, tous statuts confondus. */
@Injectable()
export class ListBrandEventsUseCase {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly brandRepository: BrandRepository,
  ) {}

  async execute(
    ownerId: string,
    params: ListEventsParams,
  ): Promise<{ events: Event[]; total: number }> {
    const brand = await this.brandRepository.findByOwnerId(ownerId);
    if (!brand) throw new BrandRequiredError();
    return this.eventRepository.listByBrand(brand.id, params);
  }
}
