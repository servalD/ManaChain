import { InMemoryRefreshTokenRepository } from '../test-fakes';
import { LogoutUseCase } from './logout.use-case';

describe('LogoutUseCase', () => {
  let refreshTokens: InMemoryRefreshTokenRepository;
  let useCase: LogoutUseCase;

  beforeEach(() => {
    refreshTokens = new InMemoryRefreshTokenRepository();
    useCase = new LogoutUseCase(refreshTokens);
  });

  it('revokes the refresh token', async () => {
    await refreshTokens.create(
      'user-1',
      'refresh-1',
      new Date(Date.now() + 60_000),
    );

    await useCase.execute('refresh-1');

    expect((await refreshTokens.find('refresh-1'))?.revokedAt).not.toBeNull();
  });

  it('is idempotent for an unknown token', async () => {
    await expect(useCase.execute('missing')).resolves.toBeUndefined();
  });
});
