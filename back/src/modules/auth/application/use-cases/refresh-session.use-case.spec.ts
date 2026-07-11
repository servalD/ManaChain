import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { InMemoryUserBanRepository } from '../../../users/application/test-fakes';
import { UserBannedError } from '../../../users/domain/user.errors';
import { InvalidTokenError } from '../../domain/auth.errors';
import {
  FakeAppTokenService,
  FakeTokenGenerator,
  InMemoryRefreshTokenRepository,
} from '../test-fakes';
import { RefreshSessionUseCase } from './refresh-session.use-case';

describe('RefreshSessionUseCase', () => {
  let repo: InMemoryUserRepository;
  let bans: InMemoryUserBanRepository;
  let refreshTokens: InMemoryRefreshTokenRepository;
  let useCase: RefreshSessionUseCase;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    bans = new InMemoryUserBanRepository();
    refreshTokens = new InMemoryRefreshTokenRepository();
    useCase = new RefreshSessionUseCase(
      refreshTokens,
      repo,
      bans,
      new FakeAppTokenService(),
      new FakeTokenGenerator(),
    );
  });

  it('rotates the refresh token and signs a new access token', async () => {
    const user = repo.seed({ email: 'ada@example.com' });
    await refreshTokens.create(user.id, 'refresh-1', new Date(Date.now() + 60_000));

    const result = await useCase.execute('refresh-1');

    expect(result.user.id).toBe(user.id);
    expect(result.token).toBe(`jwt:${user.id}`);
    expect(result.refreshToken).not.toBe('refresh-1');
    expect((await refreshTokens.find('refresh-1'))?.revokedAt).not.toBeNull();
    expect((await refreshTokens.find(result.refreshToken))?.revokedAt).toBeNull();
  });

  it('rejects an unknown refresh token', async () => {
    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      InvalidTokenError,
    );
  });

  it('rejects an expired refresh token', async () => {
    const user = repo.seed({ email: 'ada@example.com' });
    await refreshTokens.create(user.id, 'refresh-1', new Date(Date.now() - 1000));

    await expect(useCase.execute('refresh-1')).rejects.toBeInstanceOf(
      InvalidTokenError,
    );
  });

  it('revokes the whole session on reuse of an already-revoked token (theft detection)', async () => {
    const user = repo.seed({ email: 'ada@example.com' });
    await refreshTokens.create(user.id, 'refresh-1', new Date(Date.now() + 60_000));
    await refreshTokens.create(user.id, 'refresh-2', new Date(Date.now() + 60_000));
    await refreshTokens.revoke('refresh-1');

    await expect(useCase.execute('refresh-1')).rejects.toBeInstanceOf(
      InvalidTokenError,
    );
    expect((await refreshTokens.find('refresh-2'))?.revokedAt).not.toBeNull();
  });

  it('rejects a refresh for a banned user', async () => {
    const user = repo.seed({ email: 'ada@example.com' });
    await refreshTokens.create(user.id, 'refresh-1', new Date(Date.now() + 60_000));
    await bans.create({
      userId: user.id,
      reason: 'Fraud',
      bannedBy: 'admin-1',
      isPermanent: true,
    });

    await expect(useCase.execute('refresh-1')).rejects.toBeInstanceOf(
      UserBannedError,
    );
  });
});
