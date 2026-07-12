import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import {
  InMemoryTwoFactorRecoveryCodeRepository,
  InMemoryUserBanRepository,
} from '../../../users/application/test-fakes';
import { UserBannedError } from '../../../users/domain/user.errors';
import {
  InvalidOrExpiredTwoFactorChallengeError,
  InvalidTwoFactorCodeError,
  TooManyTwoFactorAttemptsError,
} from '../../domain/auth.errors';
import {
  FakeAppTokenService,
  FakePasswordHasher,
  FakeTokenGenerator,
  FakeTotpService,
  FakeTwoFactorSecretCipher,
  InMemoryRefreshTokenRepository,
  InMemoryTwoFactorChallengeRepository,
} from '../test-fakes';
import { VerifyTwoFactorUseCase } from './verify-two-factor.use-case';

describe('VerifyTwoFactorUseCase', () => {
  let repo: InMemoryUserRepository;
  let bans: InMemoryUserBanRepository;
  let recoveryCodes: InMemoryTwoFactorRecoveryCodeRepository;
  let challenges: InMemoryTwoFactorChallengeRepository;
  let refreshTokens: InMemoryRefreshTokenRepository;
  let passwordHasher: FakePasswordHasher;
  let useCase: VerifyTwoFactorUseCase;

  const futureDate = () => new Date(Date.now() + 60_000);

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    bans = new InMemoryUserBanRepository();
    recoveryCodes = new InMemoryTwoFactorRecoveryCodeRepository();
    challenges = new InMemoryTwoFactorChallengeRepository();
    refreshTokens = new InMemoryRefreshTokenRepository();
    passwordHasher = new FakePasswordHasher();
    useCase = new VerifyTwoFactorUseCase(
      challenges,
      repo,
      bans,
      recoveryCodes,
      new FakeTotpService(),
      new FakeTwoFactorSecretCipher(),
      passwordHasher,
      new FakeAppTokenService(),
      new FakeTokenGenerator(),
      refreshTokens,
    );
  });

  const seedUserWithChallenge = async () => {
    const user = repo.seed({
      email: 'ada@example.com',
      twoFactorEnabled: true,
    });
    await repo.setTwoFactorSecret(user.id, 'enc:FAKE_SECRET');
    await challenges.create(user.id, 'challenge-1', futureDate());
    return user;
  };

  it('signs a token and consumes the challenge for a valid TOTP code', async () => {
    const user = await seedUserWithChallenge();

    const result = await useCase.execute('challenge-1', '424242');

    expect(result.user.id).toBe(user.id);
    expect(result.token).toBe(`jwt:${user.id}`);
    expect(await challenges.find('challenge-1')).toBeNull();
  });

  it('accepts a recovery code and consumes it', async () => {
    const user = await seedUserWithChallenge();
    const hash = await passwordHasher.hash('abcde12345');
    await recoveryCodes.replaceAll(user.id, [hash]);

    const result = await useCase.execute('challenge-1', 'ABCDE-12345');

    expect(result.user.id).toBe(user.id);
    expect(await recoveryCodes.findUnused(user.id)).toHaveLength(0);
  });

  it('rejects an incorrect code and increments attempts', async () => {
    await seedUserWithChallenge();

    await expect(
      useCase.execute('challenge-1', 'wrong-code'),
    ).rejects.toBeInstanceOf(InvalidTwoFactorCodeError);
    expect((await challenges.find('challenge-1'))?.attempts).toBe(1);
  });

  it('locks the challenge out after too many failed attempts', async () => {
    await seedUserWithChallenge();

    for (let i = 0; i < 4; i++) {
      await expect(
        useCase.execute('challenge-1', 'wrong-code'),
      ).rejects.toBeInstanceOf(InvalidTwoFactorCodeError);
    }
    await expect(
      useCase.execute('challenge-1', 'wrong-code'),
    ).rejects.toBeInstanceOf(TooManyTwoFactorAttemptsError);
    expect(await challenges.find('challenge-1')).toBeNull();
  });

  it('rejects an unknown or expired challenge', async () => {
    await expect(useCase.execute('missing', '424242')).rejects.toBeInstanceOf(
      InvalidOrExpiredTwoFactorChallengeError,
    );
  });

  it('rejects a banned user even with a valid code', async () => {
    const user = await seedUserWithChallenge();
    await bans.create({
      userId: user.id,
      reason: 'Fraud',
      bannedBy: 'admin-1',
      isPermanent: true,
    });

    await expect(
      useCase.execute('challenge-1', '424242'),
    ).rejects.toBeInstanceOf(UserBannedError);
  });
});
