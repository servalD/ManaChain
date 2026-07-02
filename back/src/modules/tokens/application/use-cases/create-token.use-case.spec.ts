import {
  AccountNotVerifiedError,
  BrandAlreadyHasTokenError,
  BrandRequiredError,
  TokenSymbolTakenError,
} from '../../domain/token.errors';
import { FakeBrandLookup, InMemoryTokenRepository } from '../test-fakes';
import { CreateTokenUseCase } from './create-token.use-case';

describe('CreateTokenUseCase', () => {
  let tokens: InMemoryTokenRepository;
  let brands: FakeBrandLookup;
  let useCase: CreateTokenUseCase;

  beforeEach(() => {
    tokens = new InMemoryTokenRepository();
    brands = new FakeBrandLookup();
    useCase = new CreateTokenUseCase(tokens, brands);
  });

  it('creates the token of the user brand (symbol upper-cased)', async () => {
    brands.seedBrand('brand-1', 'owner-1');
    const token = await useCase.execute('owner-1', true, { symbol: 'mana' });
    expect(token.brandId).toBe('brand-1');
    expect(token.symbol).toBe('MANA');
  });

  it('throws when the user has no brand', async () => {
    await expect(
      useCase.execute('owner-1', true, { symbol: 'MANA' }),
    ).rejects.toBeInstanceOf(BrandRequiredError);
  });

  it('throws when the brand already has a token', async () => {
    brands.seedBrand('brand-1', 'owner-1');
    tokens.seed({ brandId: 'brand-1' });
    await expect(
      useCase.execute('owner-1', true, { symbol: 'MANA' }),
    ).rejects.toBeInstanceOf(BrandAlreadyHasTokenError);
  });

  it('throws when the symbol is taken', async () => {
    brands.seedBrand('brand-1', 'owner-1');
    tokens.seed({ brandId: 'brand-2', symbol: 'MANA' });
    await expect(
      useCase.execute('owner-1', true, { symbol: 'MANA' }),
    ).rejects.toBeInstanceOf(TokenSymbolTakenError);
  });

  it('rejects an unverified account', async () => {
    brands.seedBrand('brand-1', 'owner-1');
    await expect(
      useCase.execute('owner-1', false, { symbol: 'MANA' }),
    ).rejects.toBeInstanceOf(AccountNotVerifiedError);
  });
});
