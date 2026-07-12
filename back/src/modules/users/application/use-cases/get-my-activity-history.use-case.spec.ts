import { FakeUserActivityHistoryReader } from '../test-fakes';
import { GetMyActivityHistoryUseCase } from './get-my-activity-history.use-case';

describe('GetMyActivityHistoryUseCase', () => {
  it('returns the history from the reader', async () => {
    const reader = new FakeUserActivityHistoryReader();
    reader.seedHistory('user-1', [
      {
        date: '2026-07-01',
        likesGiven: 1,
        tokenPurchases: 2,
        eventsAttended: 0,
        supportScore: 10,
      },
    ]);
    const useCase = new GetMyActivityHistoryUseCase(reader);

    await expect(useCase.execute('user-1', 30)).resolves.toEqual([
      {
        date: '2026-07-01',
        likesGiven: 1,
        tokenPurchases: 2,
        eventsAttended: 0,
        supportScore: 10,
      },
    ]);
  });

  it('returns an empty array when nothing is seeded', async () => {
    const reader = new FakeUserActivityHistoryReader();
    const useCase = new GetMyActivityHistoryUseCase(reader);

    await expect(useCase.execute('user-1', 30)).resolves.toEqual([]);
  });
});
