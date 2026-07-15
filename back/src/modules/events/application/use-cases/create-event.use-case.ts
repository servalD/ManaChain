import { Injectable } from '@nestjs/common';
import { Event } from '../../domain/event';
import { EventRepository } from '../../domain/event.repository';
import {
  BrandRequiredError,
  EventEndBeforeStartError,
} from '../../domain/event.errors';
import { BrandRepository } from '../../../brands/domain/brand.repository';

export interface CreateEventInput {
  title: string;
  type: string;
  description?: string;
  addressStreet?: string;
  addressCity?: string;
  addressZipCode?: string;
  addressCountry?: string;
  addressComplement?: string;
  startsAt: string;
  endsAt?: string;
  maxTickets?: number;
  minTokenBalance?: number;
  coverImageUrl?: string;
}

/** Crée le draft DB d'un événement (étape 1 du wizard) — pas encore de contrat déployé. */
@Injectable()
export class CreateEventUseCase {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly brandRepository: BrandRepository,
  ) {}

  async execute(ownerId: string, input: CreateEventInput): Promise<Event> {
    const brand = await this.brandRepository.findByOwnerId(ownerId);
    if (!brand) throw new BrandRequiredError();

    if (input.endsAt && new Date(input.endsAt) < new Date(input.startsAt)) {
      throw new EventEndBeforeStartError();
    }

    return this.eventRepository.create({
      brandId: brand.id,
      title: input.title,
      type: input.type,
      description: input.description,
      addressStreet: input.addressStreet,
      addressCity: input.addressCity,
      addressZipCode: input.addressZipCode,
      addressCountry: input.addressCountry,
      addressComplement: input.addressComplement,
      startsAt: new Date(input.startsAt),
      endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
      maxTickets: input.maxTickets,
      minTokenBalance: input.minTokenBalance,
      coverImageUrl: input.coverImageUrl,
    });
  }
}
