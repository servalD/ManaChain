import { Injectable } from '@nestjs/common';
import { Event } from '../../domain/event';
import { EventRepository } from '../../domain/event.repository';
import { EventNotFoundError } from '../../domain/event.errors';

@Injectable()
export class GetEventUseCase {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(id: string): Promise<Event> {
    const event = await this.eventRepository.findById(id);
    if (!event) throw new EventNotFoundError();
    return event;
  }
}
