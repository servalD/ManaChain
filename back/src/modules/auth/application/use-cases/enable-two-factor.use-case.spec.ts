import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { InMemoryTwoFactorRecoveryCodeRepository } from '../../../users/application/test-fakes';
import {
  InvalidTwoFactorCodeError,
  TwoFactorAlreadyEnabledError,
  TwoFactorSetupNotStartedError,
} from '../../domain/auth.errors';
import {
  FakeMailer,
  FakePasswordHasher,
  FakeTokenGenerator,
  FakeTotpService,
  FakeTwoFactorSecretCipher,
} from '../test-fakes';
import { EnableTwoFactorUseCase } from './enable-two-factor.use-case';

describe('EnableTwoFactorUseCase', () => {
  let repo: InMemoryUserRepository;
  let recoveryCodes: InMemoryTwoFactorRecoveryCodeRepository;
  let mailer: FakeMailer;
  let useCase: EnableTwoFactorUseCase;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    recoveryCodes = new InMemoryTwoFactorRecoveryCodeRepository();
    mailer = new FakeMailer();
    useCase = new EnableTwoFactorUseCase(
      repo,
      recoveryCodes,
      new FakeTotpService(),
      new FakeTwoFactorSecretCipher(),
      new FakePasswordHasher(),
      new FakeTokenGenerator(),
      mailer,
    );
  });

  it('enables 2FA and returns 10 recovery codes given a valid live code', async () => {
    const user = repo.seed({ email: 'ada@example.com', username: 'ada' });
    await repo.setTwoFactorSecret(user.id, 'enc:FAKE_SECRET');

    const codes = await useCase.execute(user.id, '424242');

    expect(codes).toHaveLength(10);
    expect((await repo.findById(user.id))?.twoFactorEnabled).toBe(true);
    expect(await recoveryCodes.findUnused(user.id)).toHaveLength(10);
    expect(mailer.twoFactorEnabled).toEqual(['ada@example.com']);
  });

  it('rejects an incorrect code', async () => {
    const user = repo.seed({ email: 'ada@example.com' });
    await repo.setTwoFactorSecret(user.id, 'enc:FAKE_SECRET');

    await expect(useCase.execute(user.id, 'wrong')).rejects.toBeInstanceOf(
      InvalidTwoFactorCodeError,
    );
  });

  it('rejects enabling without a prior setup', async () => {
    const user = repo.seed({ email: 'ada@example.com' });

    await expect(
      useCase.execute(user.id, '424242'),
    ).rejects.toBeInstanceOf(TwoFactorSetupNotStartedError);
  });

  it('rejects enabling twice', async () => {
    const user = repo.seed({ email: 'ada@example.com', twoFactorEnabled: true });
    await repo.setTwoFactorSecret(user.id, 'enc:FAKE_SECRET');

    await expect(
      useCase.execute(user.id, '424242'),
    ).rejects.toBeInstanceOf(TwoFactorAlreadyEnabledError);
  });
});
