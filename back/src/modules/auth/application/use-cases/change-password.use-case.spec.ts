import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { InvalidCredentialsError } from '../../domain/auth.errors';
import {
  FakeMailer,
  FakePasswordHasher,
  InMemoryRefreshTokenRepository,
} from '../test-fakes';
import { ChangePasswordUseCase } from './change-password.use-case';

describe('ChangePasswordUseCase', () => {
  let repo: InMemoryUserRepository;
  let refreshTokens: InMemoryRefreshTokenRepository;
  let mailer: FakeMailer;
  let useCase: ChangePasswordUseCase;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    refreshTokens = new InMemoryRefreshTokenRepository();
    mailer = new FakeMailer();
    useCase = new ChangePasswordUseCase(
      repo,
      refreshTokens,
      new FakePasswordHasher(),
      mailer,
    );
  });

  it('changes the password and revokes active sessions given the correct current password', async () => {
    const user = repo.seed({
      email: 'ada@example.com',
      username: 'ada',
      passwordHash: 'hashed:S3cret!pwd',
    });
    await refreshTokens.create(user.id, 'refresh-1', new Date(Date.now() + 60_000));

    await useCase.execute(user.id, 'S3cret!pwd', 'N3wSecret!pwd');

    const credentials = await repo.findCredentialsByEmail('ada@example.com');
    expect(credentials?.passwordHash).toBe('hashed:N3wSecret!pwd');
    expect(mailer.changed).toEqual(['ada@example.com']);
    expect((await refreshTokens.find('refresh-1'))?.revokedAt).not.toBeNull();
  });

  it('rejects an incorrect current password without changing anything', async () => {
    const user = repo.seed({
      email: 'ada@example.com',
      passwordHash: 'hashed:S3cret!pwd',
    });
    await refreshTokens.create(user.id, 'refresh-1', new Date(Date.now() + 60_000));

    await expect(
      useCase.execute(user.id, 'wrong', 'N3wSecret!pwd'),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(mailer.changed).toHaveLength(0);
    expect((await refreshTokens.find('refresh-1'))?.revokedAt).toBeNull();
  });
});
