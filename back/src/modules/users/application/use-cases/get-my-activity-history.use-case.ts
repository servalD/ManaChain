import { Injectable } from '@nestjs/common';
import {
  ActivityPoint,
  UserActivityHistoryReader,
} from '../../domain/user-activity-history.reader';

/** Historique d'activité (likes/supports/events par jour + score de support cumulé). */
@Injectable()
export class GetMyActivityHistoryUseCase {
  constructor(private readonly historyReader: UserActivityHistoryReader) {}

  execute(userId: string, days: number): Promise<ActivityPoint[]> {
    return this.historyReader.getHistory(userId, days);
  }
}
