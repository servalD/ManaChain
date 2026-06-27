import { InMemoryUserRepository } from '../../infrastructure/in-memory-user.repository';
import {
  UsernameAlreadyTakenError,
  UserNotFoundError,
} from '../../domain/user.errors';
import { UpdateUserUseCase } from './update-user.use-case';

describe('UpdateUserUseCase', () => {
  let repository: InMemoryUserRepository;
  let useCase: UpdateUserUseCase;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
    useCase = new UpdateUserUseCase(repository);
  });

  it('updates the profile fields of an existing user', async () => {
    const user = repository.seed({ firstName: 'Old', username: 'old_name' });

    const updated = await useCase.execute(user.id, {
      firstName: 'New',
      username: 'new_name',
    });

    expect(updated.firstName).toBe('New');
    expect(updated.username).toBe('new_name');
  });

  it('throws UserNotFoundError when the user does not exist', async () => {
    await expect(
      useCase.execute('missing-id', { firstName: 'X' }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('throws UsernameAlreadyTakenError when the username belongs to another user', async () => {
    repository.seed({ username: 'taken' });
    const user = repository.seed({ username: 'mine' });

    await expect(
      useCase.execute(user.id, { username: 'taken' }),
    ).rejects.toBeInstanceOf(UsernameAlreadyTakenError);
  });

  it('allows keeping the same username', async () => {
    const user = repository.seed({ username: 'mine', lastName: 'Before' });

    const updated = await useCase.execute(user.id, {
      username: 'mine',
      lastName: 'After',
    });

    expect(updated.lastName).toBe('After');
  });
});
