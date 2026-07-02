import { InMemoryUserRepository } from '../../infrastructure/in-memory-user.repository';
import { FakeTransactionRunner } from '../test-fakes';
import { GetMyInterestsUseCase } from './get-my-interests.use-case';
import { UpdateMyInterestsUseCase } from './update-my-interests.use-case';

describe('UpdateMyInterestsUseCase', () => {
  it('replaces the interests of the current user', async () => {
    const repository = new InMemoryUserRepository();
    const user = repository.seed();
    const updateUseCase = new UpdateMyInterestsUseCase(
      repository,
      new FakeTransactionRunner(),
    );
    const getUseCase = new GetMyInterestsUseCase(repository);

    await updateUseCase.execute(user.id, ['tech', 'music']);
    await expect(getUseCase.execute(user.id)).resolves.toEqual([
      'tech',
      'music',
    ]);

    await updateUseCase.execute(user.id, ['art']);
    await expect(getUseCase.execute(user.id)).resolves.toEqual(['art']);
  });
});
