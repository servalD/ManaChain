import { InMemoryBrandRepository } from '../../infrastructure/in-memory-brand.repository';
import { FakeBrandBanReader } from '../test-fakes';
import { ListActiveBrandsUseCase } from './list-active-brands.use-case';

const baseBrand = {
  country: 'FR',
  headquartersStreet: '1 rue X',
  headquartersCity: 'Paris',
  headquartersZipCode: '75001',
  interestIds: [],
};

describe('ListActiveBrandsUseCase', () => {
  let brands: InMemoryBrandRepository;
  let bans: FakeBrandBanReader;
  let useCase: ListActiveBrandsUseCase;

  beforeEach(() => {
    brands = new InMemoryBrandRepository();
    bans = new FakeBrandBanReader();
    useCase = new ListActiveBrandsUseCase(brands, bans);
  });

  it('excludes actively banned brands', async () => {
    const a = await brands.create({ ownerId: 'o1', name: 'A', ...baseBrand });
    const b = await brands.create({ ownerId: 'o2', name: 'B', ...baseBrand });
    bans.seedBanned(b.id);

    const { brands: result, total } = await useCase.execute({
      limit: 10,
      offset: 0,
    });

    expect(result.map((x) => x.id)).toEqual([a.id]);
    expect(total).toBe(1);
  });

  it('returns all brands when there is no active ban', async () => {
    await brands.create({ ownerId: 'o1', name: 'A', ...baseBrand });
    await brands.create({ ownerId: 'o2', name: 'B', ...baseBrand });

    const { total } = await useCase.execute({ limit: 10, offset: 0 });
    expect(total).toBe(2);
  });
});
