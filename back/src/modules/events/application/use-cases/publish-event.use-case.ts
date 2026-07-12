import { Injectable } from '@nestjs/common';
import { Event } from '../../domain/event';
import { EventRepository } from '../../domain/event.repository';
import {
  EventAlreadyPublishedError,
  EventNotFoundError,
  EventNotReadyToPublishError,
  NotEventOwnerError,
} from '../../domain/event.errors';
import { BrandRepository } from '../../../brands/domain/brand.repository';

@Injectable()
export class PublishEventUseCase {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly brandRepository: BrandRepository,
  ) {}

  async execute(callerId: string, eventId: string): Promise<Event> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) throw new EventNotFoundError();

    const brand = await this.brandRepository.findByOwnerId(callerId);
    if (!brand || brand.id !== event.brandId) throw new NotEventOwnerError();

    if (event.status !== 'draft') throw new EventAlreadyPublishedError();
    if (!event.eventTicketsAddress || !event.ticketSaleAddress) {
      throw new EventNotReadyToPublishError();
    }

    return this.eventRepository.publish(eventId);
  }
}
