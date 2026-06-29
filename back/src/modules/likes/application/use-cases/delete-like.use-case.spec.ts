import { InMemoryLikeRepository } from '../../infrastructure/in-memory-like.repository';
import { LikeNotFoundError, NotLikeOwnerError } from '../../domain/like.errors';
import { DeleteLikeUseCase } from './delete-like.use-case';

describe('DeleteLikeUseCase', () => {
  let likes: InMemoryLikeRepository;
  let useCase: DeleteLikeUseCase;

  beforeEach(() => {
    likes = new InMemoryLikeRepository();
    useCase = new DeleteLikeUseCase(likes);
  });

  it('removes a like owned by the user', async () => {
    const like = likes.seedLike('user-1', 'brand-1');
    await useCase.execute('user-1', like.id);
    await expect(likes.findById(like.id)).resolves.toBeNull();
  });

  it('throws when the like does not exist', async () => {
    await expect(useCase.execute('user-1', 'missing')).rejects.toBeInstanceOf(
      LikeNotFoundError,
    );
  });

  it('throws when the like belongs to another user', async () => {
    const like = likes.seedLike('owner', 'brand-1');
    await expect(useCase.execute('intruder', like.id)).rejects.toBeInstanceOf(
      NotLikeOwnerError,
    );
  });
});
