import { InMemoryBrandRepository } from '../../infrastructure/in-memory-brand.repository';
import { BrandNotFoundError } from '../../domain/brand.errors';
import { FakeBrandTokenStatsReader } from '../test-fakes';
import { GetBrandStatsUseCase } from './get-brand-stats.use-case';

const baseBrand = {
  name: 'Acme',
  country: 'FR',
  headquartersStreet: '1 rue X',
  headquartersCity: 'Paris',
  headquartersZipCode: '75001',
  interestIds: [],
};

describe('GetBrandStatsUseCase', () => {
  let brands: InMemoryBrandRepository;
  let reader: FakeBrandTokenStatsReader;
  let useCase: GetBrandStatsUseCase;

  beforeEach(() => {
    brands = new InMemoryBrandRepository();
    reader = new FakeBrandTokenStatsReader();
    useCase = new GetBrandStatsUseCase(brands, reader);
  });

  it('throws when the brand does not exist', async () => {
    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      BrandNotFoundError,
    );
  });

  it('returns zeros when the brand has no token', async () => {
    const brand = await brands.create({ ownerId: 'owner-1', ...baseBrand });
    await expect(useCase.execute(brand.id)).resolves.toEqual({
      tokenHolders: 0,
      totalRaised: '0',
      tokenSymbol: null,
      tokenPrice: null,
    });
  });

  it('returns the token stats from the reader', async () => {
    const brand = await brands.create({ ownerId: 'owner-1', ...baseBrand });
    reader.seedStats(brand.id, {
      tokenHolders: 3,
      totalRaised: '1500.00',
      tokenSymbol: 'MANA',
      tokenPrice: '1.50',
    });
    await expect(useCase.execute(brand.id)).resolves.toEqual({
      tokenHolders: 3,
      totalRaised: '1500.00',
      tokenSymbol: 'MANA',
      tokenPrice: '1.50',
    });
  });
});
