import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { Role } from '../../../../shared/enums/role.enum';
import { InMemoryLikeRepository } from '../../infrastructure/in-memory-like.repository';
import { InMemoryBrandDirectory } from '../../infrastructure/in-memory-brand-directory';
import {
  BrandNotFoundError,
  NotBrandOwnerError,
} from '../../domain/like.errors';
import { GetBrandLikesUseCase } from './get-brand-likes.use-case';

describe('GetBrandLikesUseCase', () => {
  let likes: InMemoryLikeRepository;
  let brands: InMemoryBrandDirectory;
  let users: InMemoryUserRepository;
  let useCase: GetBrandLikesUseCase;

  const brandId = 'brand-1';

  beforeEach(() => {
    likes = new InMemoryLikeRepository();
    brands = new InMemoryBrandDirectory();
    users = new InMemoryUserRepository();
    useCase = new GetBrandLikesUseCase(likes, brands);
  });

  it('returns likers when the requester owns the brand', async () => {
    const owner = users.seed({ id: 'owner-1', role: Role.CLIENT });
    brands.seedBrand(brandId, owner.id);
    likes.seedLikers([
      {
        likeId: 'l1',
        likedAt: new Date(),
        user: {
          id: 'u2',
          username: 'liker',
          firstName: 'L',
          lastName: 'K',
          avatarUrl: null,
          ageRange: '25-34',
          verified: true,
        },
      },
    ]);

    const result = await useCase.execute(owner, brandId);
    expect(result).toHaveLength(1);
  });

  it('allows an admin who is not the owner', async () => {
    const admin = users.seed({ id: 'admin-1', role: Role.ADMIN });
    brands.seedBrand(brandId, 'someone-else');
    await expect(useCase.execute(admin, brandId)).resolves.toEqual([]);
  });

  it('forbids a non-owner non-admin', async () => {
    const other = users.seed({ id: 'other-1', role: Role.CLIENT });
    brands.seedBrand(brandId, 'owner-1');
    await expect(useCase.execute(other, brandId)).rejects.toBeInstanceOf(
      NotBrandOwnerError,
    );
  });

  it('throws when the brand does not exist', async () => {
    const user = users.seed({ id: 'u1', role: Role.CLIENT });
    await expect(useCase.execute(user, brandId)).rejects.toBeInstanceOf(
      BrandNotFoundError,
    );
  });
});
