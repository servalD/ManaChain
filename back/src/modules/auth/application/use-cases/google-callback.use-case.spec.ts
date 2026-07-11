import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { OAUTH_GOOGLE_PASSWORD_SENTINEL } from '../../../users/domain/user.repository';
import { OAuthEmailUsesPasswordError } from '../../domain/auth.errors';
import {
  FakeAppTokenService,
  FakeOAuthProvider,
  FakeTokenGenerator,
  InMemoryRefreshTokenRepository,
  InMemoryTwoFactorChallengeRepository,
} from '../test-fakes';
import {
  GoogleCallbackUseCase,
  GoogleCallbackSuccess,
} from './google-callback.use-case';

describe('GoogleCallbackUseCase', () => {
  let repo: InMemoryUserRepository;
  let challenges: InMemoryTwoFactorChallengeRepository;

  const build = (email: string) => {
    repo = new InMemoryUserRepository();
    challenges = new InMemoryTwoFactorChallengeRepository();
    return new GoogleCallbackUseCase(
      new FakeOAuthProvider({ email, firstName: 'Ada', lastName: 'Lovelace' }),
      repo,
      new FakeAppTokenService(),
      new FakeTokenGenerator(),
      challenges,
      new InMemoryRefreshTokenRepository(),
    );
  };

  it('signs a token directly for an existing Google account without 2FA', async () => {
    const useCase = build('ada@example.com');
    const user = repo.seed({
      email: 'ada@example.com',
      verified: true,
      passwordHash: OAUTH_GOOGLE_PASSWORD_SENTINEL,
    });

    const result = (await useCase.execute('code')) as GoogleCallbackSuccess;

    expect(result.twoFactorRequired).toBe(false);
    expect(result.token).toBe(`jwt:${user.id}`);
  });

  it('creates a Google account on first login', async () => {
    const useCase = build('new@example.com');

    const result = (await useCase.execute('code')) as GoogleCallbackSuccess;

    expect(result.twoFactorRequired).toBe(false);
    expect(result.token).toBeTruthy();
  });

  it('rejects a Google login for an email registered with a password', async () => {
    const useCase = build('ada@example.com');
    repo.seed({
      email: 'ada@example.com',
      verified: true,
      passwordHash: 'hashed:S3cret!pwd',
    });

    await expect(useCase.execute('code')).rejects.toBeInstanceOf(
      OAuthEmailUsesPasswordError,
    );
  });

  it('returns a challenge instead of a token when 2FA is enabled', async () => {
    const useCase = build('ada@example.com');
    const user = repo.seed({
      email: 'ada@example.com',
      verified: true,
      passwordHash: OAUTH_GOOGLE_PASSWORD_SENTINEL,
      twoFactorEnabled: true,
    });

    const result = await useCase.execute('code');

    expect(result.twoFactorRequired).toBe(true);
    if (!result.twoFactorRequired) throw new Error('expected a challenge');
    const challenge = await challenges.find(result.challengeToken);
    expect(challenge?.userId).toBe(user.id);
  });
});
