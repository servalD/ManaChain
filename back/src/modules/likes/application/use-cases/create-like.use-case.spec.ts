import { InMemoryLikeRepository } from '../../infrastructure/in-memory-like.repository';
import { InMemoryBrandDirectory } from '../../infrastructure/in-memory-brand-directory';
import {
  AlreadyLikedError,
  BrandNotFoundError,
} from '../../domain/like.errors';
import { CreateLikeUseCase } from './create-like.use-case';

describe('CreateLikeUseCase', () => {
  let likes: InMemoryLikeRepository;
  let brands: InMemoryBrandDirectory;
  let useCase: CreateLikeUseCase;

  const userId = 'user-1';
  const brandId = 'brand-1';

  beforeEach(() => {
    likes = new InMemoryLikeRepository();
    brands = new InMemoryBrandDirectory();
    useCase = new CreateLikeUseCase(likes, brands);
  });

  it('creates a like for an existing brand', async () => {
    brands.seedBrand(brandId, 'owner-1');
    const like = await useCase.execute(userId, brandId);
    expect(like.userId).toBe(userId);
    expect(like.brandId).toBe(brandId);
  });

  it('throws when the brand does not exist', async () => {
    await expect(useCase.execute(userId, brandId)).rejects.toBeInstanceOf(
      BrandNotFoundError,
    );
  });

  it('throws when the brand is already liked', async () => {
    brands.seedBrand(brandId, 'owner-1');
    likes.seedLike(userId, brandId);
    await expect(useCase.execute(userId, brandId)).rejects.toBeInstanceOf(
      AlreadyLikedError,
    );
  });
});
