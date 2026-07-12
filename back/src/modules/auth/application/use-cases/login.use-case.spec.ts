import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { InMemoryUserBanRepository } from '../../../users/application/test-fakes';
import { UserBannedError } from '../../../users/domain/user.errors';
import {
  EmailNotVerifiedError,
  InvalidCredentialsError,
} from '../../domain/auth.errors';
import {
  FakeAppTokenService,
  FakePasswordHasher,
  FakeTokenGenerator,
  InMemoryRefreshTokenRepository,
  InMemoryTwoFactorChallengeRepository,
} from '../test-fakes';
import { LoginUseCase, LoginSuccess } from './login.use-case';

describe('LoginUseCase', () => {
  let repo: InMemoryUserRepository;
  let bans: InMemoryUserBanRepository;
  let challenges: InMemoryTwoFactorChallengeRepository;
  let refreshTokens: InMemoryRefreshTokenRepository;
  let useCase: LoginUseCase;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    bans = new InMemoryUserBanRepository();
    challenges = new InMemoryTwoFactorChallengeRepository();
    refreshTokens = new InMemoryRefreshTokenRepository();
    useCase = new LoginUseCase(
      repo,
      bans,
      new FakePasswordHasher(),
      new FakeAppTokenService(),
      new FakeTokenGenerator(),
      challenges,
      refreshTokens,
    );
  });

  it('signs a token for valid, verified credentials', async () => {
    const user = repo.seed({
      email: 'ada@example.com',
      verified: true,
      passwordHash: 'hashed:S3cret!pwd',
    });

    const result = (await useCase.execute(
      'ada@example.com',
      'S3cret!pwd',
    )) as LoginSuccess;

    expect(result.twoFactorRequired).toBe(false);
    expect(result.token).toBe(`jwt:${user.id}`);
    expect(result.user.id).toBe(user.id);
    expect(result.refreshToken).toBeTruthy();
    expect(await refreshTokens.find(result.refreshToken)).toMatchObject({
      userId: user.id,
    });
  });

  it('rejects an unknown email', async () => {
    await expect(
      useCase.execute('nobody@example.com', 'x'),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects an unverified account', async () => {
    repo.seed({
      email: 'ada@example.com',
      verified: false,
      passwordHash: 'hashed:S3cret!pwd',
    });
    await expect(
      useCase.execute('ada@example.com', 'S3cret!pwd'),
    ).rejects.toBeInstanceOf(EmailNotVerifiedError);
  });

  it('rejects a wrong password', async () => {
    repo.seed({
      email: 'ada@example.com',
      verified: true,
      passwordHash: 'hashed:S3cret!pwd',
    });
    await expect(
      useCase.execute('ada@example.com', 'wrong'),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects a banned account, even with correct credentials', async () => {
    const user = repo.seed({
      email: 'ada@example.com',
      verified: true,
      passwordHash: 'hashed:S3cret!pwd',
    });
    await bans.create({
      userId: user.id,
      reason: 'Fraud',
      bannedBy: 'admin-1',
      isPermanent: true,
    });

    await expect(
      useCase.execute('ada@example.com', 'S3cret!pwd'),
    ).rejects.toBeInstanceOf(UserBannedError);
  });

  it('returns a challenge instead of a token when 2FA is enabled', async () => {
    const user = repo.seed({
      email: 'ada@example.com',
      verified: true,
      passwordHash: 'hashed:S3cret!pwd',
      twoFactorEnabled: true,
    });

    const result = await useCase.execute('ada@example.com', 'S3cret!pwd');

    expect(result.twoFactorRequired).toBe(true);
    if (!result.twoFactorRequired) throw new Error('expected a challenge');
    expect(result.challengeToken).toBeTruthy();
    const challenge = await challenges.find(result.challengeToken);
    expect(challenge?.userId).toBe(user.id);
  });
});
