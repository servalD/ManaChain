import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { UserNotFoundError } from '../../../users/domain/user.errors';
import { TwoFactorAlreadyEnabledError } from '../../domain/auth.errors';
import { FakeTotpService, FakeTwoFactorSecretCipher } from '../test-fakes';
import { SetupTwoFactorUseCase } from './setup-two-factor.use-case';

describe('SetupTwoFactorUseCase', () => {
  let repo: InMemoryUserRepository;
  let useCase: SetupTwoFactorUseCase;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    useCase = new SetupTwoFactorUseCase(
      repo,
      new FakeTotpService(),
      new FakeTwoFactorSecretCipher(),
    );
  });

  it('generates and persists an encrypted secret, without enabling 2FA yet', async () => {
    const user = repo.seed({ email: 'ada@example.com' });

    const result = await useCase.execute(user.id);

    expect(result.secret).toBe('FAKE_SECRET');
    expect(result.otpauthUri).toContain('FAKE_SECRET');
    expect(await repo.getTwoFactorSecret(user.id)).toBe('enc:FAKE_SECRET');
    expect((await repo.findById(user.id))?.twoFactorEnabled).toBe(false);
  });

  it('rejects setup if 2FA is already enabled', async () => {
    const user = repo.seed({
      email: 'ada@example.com',
      twoFactorEnabled: true,
    });

    await expect(useCase.execute(user.id)).rejects.toBeInstanceOf(
      TwoFactorAlreadyEnabledError,
    );
  });

  it('rejects an unknown user', async () => {
    await expect(useCase.execute('missing-id')).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });
});
