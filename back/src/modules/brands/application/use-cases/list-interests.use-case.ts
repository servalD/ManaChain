import { Injectable } from '@nestjs/common';
import { InterestReader, InterestSummary } from '../../domain/interest-reader';

/** Liste les centres d'intérêt disponibles (public, pour les sélecteurs). */
@Injectable()
export class ListInterestsUseCase {
  constructor(private readonly reader: InterestReader) {}

  execute(): Promise<InterestSummary[]> {
    return this.reader.listAll();
  }
}
