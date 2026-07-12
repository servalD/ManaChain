import { InMemoryBrandRepository } from '../../infrastructure/in-memory-brand.repository';
import { BrandNotFoundError } from '../../domain/brand.errors';
import { FakeBrandEngagementHistoryReader } from '../test-fakes';
import { GetBrandEngagementHistoryUseCase } from './get-brand-engagement-history.use-case';

const baseBrand = {
  name: 'Acme',
  country: 'FR',
  headquartersStreet: '1 rue X',
  headquartersCity: 'Paris',
  headquartersZipCode: '75001',
  interestIds: [],
};

describe('GetBrandEngagementHistoryUseCase', () => {
  let brands: InMemoryBrandRepository;
  let reader: FakeBrandEngagementHistoryReader;
  let useCase: GetBrandEngagementHistoryUseCase;

  beforeEach(() => {
    brands = new InMemoryBrandRepository();
    reader = new FakeBrandEngagementHistoryReader();
    useCase = new GetBrandEngagementHistoryUseCase(brands, reader);
  });

  it('throws when the brand does not exist', async () => {
    await expect(useCase.execute('missing', 30)).rejects.toBeInstanceOf(
      BrandNotFoundError,
    );
  });

  it('returns the history from the reader', async () => {
    const brand = await brands.create({ ownerId: 'owner-1', ...baseBrand });
    reader.seedHistory(brand.id, [
      { date: '2026-07-01', holders: 1, likes: 2 },
      { date: '2026-07-02', holders: 2, likes: 3 },
    ]);
    await expect(useCase.execute(brand.id, 30)).resolves.toEqual([
      { date: '2026-07-01', holders: 1, likes: 2 },
      { date: '2026-07-02', holders: 2, likes: 3 },
    ]);
  });
});
