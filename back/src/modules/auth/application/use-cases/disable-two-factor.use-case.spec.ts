import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { InMemoryTwoFactorRecoveryCodeRepository } from '../../../users/application/test-fakes';
import {
  InvalidCredentialsError,
  TwoFactorNotEnabledError,
} from '../../domain/auth.errors';
import { FakeMailer, FakePasswordHasher } from '../test-fakes';
import { DisableTwoFactorUseCase } from './disable-two-factor.use-case';

describe('DisableTwoFactorUseCase', () => {
  let repo: InMemoryUserRepository;
  let recoveryCodes: InMemoryTwoFactorRecoveryCodeRepository;
  let mailer: FakeMailer;
  let useCase: DisableTwoFactorUseCase;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    recoveryCodes = new InMemoryTwoFactorRecoveryCodeRepository();
    mailer = new FakeMailer();
    useCase = new DisableTwoFactorUseCase(
      repo,
      recoveryCodes,
      new FakePasswordHasher(),
      mailer,
    );
  });

  it('disables 2FA and wipes recovery codes given the correct password', async () => {
    const user = repo.seed({
      email: 'ada@example.com',
      username: 'ada',
      twoFactorEnabled: true,
      passwordHash: 'hashed:S3cret!pwd',
    });
    await repo.setTwoFactorSecret(user.id, 'enc:FAKE_SECRET');
    await recoveryCodes.replaceAll(user.id, ['a', 'b']);

    await useCase.execute(user.id, 'S3cret!pwd');

    expect((await repo.findById(user.id))?.twoFactorEnabled).toBe(false);
    expect(await repo.getTwoFactorSecret(user.id)).toBeNull();
    expect(await recoveryCodes.findUnused(user.id)).toHaveLength(0);
    expect(mailer.twoFactorDisabled).toEqual(['ada@example.com']);
  });

  it('rejects an incorrect password', async () => {
    const user = repo.seed({
      email: 'ada@example.com',
      twoFactorEnabled: true,
      passwordHash: 'hashed:S3cret!pwd',
    });

    await expect(useCase.execute(user.id, 'wrong')).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
  });

  it('rejects disabling when 2FA is not enabled', async () => {
    const user = repo.seed({
      email: 'ada@example.com',
      twoFactorEnabled: false,
      passwordHash: 'hashed:S3cret!pwd',
    });

    await expect(
      useCase.execute(user.id, 'S3cret!pwd'),
    ).rejects.toBeInstanceOf(TwoFactorNotEnabledError);
  });
});
