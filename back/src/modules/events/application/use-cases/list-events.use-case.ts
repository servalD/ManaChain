import { Injectable } from '@nestjs/common';
import { Event } from '../../domain/event';
import {
  EventRepository,
  ListEventsParams,
} from '../../domain/event.repository';

/** Découverte publique : événements publiés uniquement. */
@Injectable()
export class ListEventsUseCase {
  constructor(private readonly eventRepository: EventRepository) {}

  execute(
    params: ListEventsParams,
  ): Promise<{ events: Event[]; total: number }> {
    return this.eventRepository.listPublished(params);
  }
}
