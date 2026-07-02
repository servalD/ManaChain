import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { InMemoryBrandRepository } from '../../infrastructure/in-memory-brand.repository';
import {
  AccountNotVerifiedError,
  BrandNameTakenError,
  InvalidInterestSelectionError,
  UserAlreadyHasBrandError,
} from '../../domain/brand.errors';
import { FakeInterestChecker } from '../test-fakes';
import { CreateBrandUseCase } from './create-brand.use-case';

describe('CreateBrandUseCase', () => {
  let brands: InMemoryBrandRepository;
  let users: InMemoryUserRepository;
  let useCase: CreateBrandUseCase;

  const input = {
    name: 'BrandCo',
    country: 'FR',
    headquartersStreet: '1 rue X',
    headquartersCity: 'Paris',
    headquartersZipCode: '75001',
    interestIds: ['tech'],
  };

  beforeEach(() => {
    brands = new InMemoryBrandRepository();
    users = new InMemoryUserRepository();
    useCase = new CreateBrandUseCase(brands, users, new FakeInterestChecker());
  });

  it('creates a brand with its interests', async () => {
    const brand = await useCase.execute('owner-1', true, input);
    expect(brand.ownerId).toBe('owner-1');
    expect(brand.interests).toHaveLength(1);
  });

  it('rejects an invalid interest count', async () => {
    await expect(
      useCase.execute('owner-1', true, { ...input, interestIds: [] }),
    ).rejects.toBeInstanceOf(InvalidInterestSelectionError);
  });

  it('rejects a user who already owns a brand', async () => {
    await useCase.execute('owner-1', true, input);
    await expect(
      useCase.execute('owner-1', true, { ...input, name: 'Other' }),
    ).rejects.toBeInstanceOf(UserAlreadyHasBrandError);
  });

  it('rejects a duplicate brand name', async () => {
    await useCase.execute('owner-1', true, input);
    await expect(
      useCase.execute('owner-2', true, input),
    ).rejects.toBeInstanceOf(BrandNameTakenError);
  });

  it('rejects an unverified account', async () => {
    await expect(
      useCase.execute('owner-1', false, input),
    ).rejects.toBeInstanceOf(AccountNotVerifiedError);
  });
});
