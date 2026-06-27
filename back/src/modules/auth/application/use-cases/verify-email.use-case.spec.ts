import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { InvalidOrExpiredTokenError } from '../../domain/auth.errors';
import { FakeMailer } from '../test-fakes';
import { VerifyEmailUseCase } from './verify-email.use-case';

describe('VerifyEmailUseCase', () => {
  let repo: InMemoryUserRepository;
  let mailer: FakeMailer;
  let useCase: VerifyEmailUseCase;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    mailer = new FakeMailer();
    useCase = new VerifyEmailUseCase(repo, mailer);
  });

  it('verifies the account and sends a welcome email', async () => {
    const user = repo.seed({ verified: false });
    await repo.setEmailVerificationToken(
      user.id,
      'tok',
      new Date(Date.now() + 60_000),
    );

    const verified = await useCase.execute('tok');

    expect(verified.verified).toBe(true);
    expect(mailer.welcomes).toContain(verified.email);
  });

  it('rejects an unknown token', async () => {
    await expect(useCase.execute('nope')).rejects.toBeInstanceOf(
      InvalidOrExpiredTokenError,
    );
  });

  it('rejects an expired token', async () => {
    const user = repo.seed({ verified: false });
    await repo.setEmailVerificationToken(
      user.id,
      'tok',
      new Date(Date.now() - 60_000),
    );

    await expect(useCase.execute('tok')).rejects.toBeInstanceOf(
      InvalidOrExpiredTokenError,
    );
  });
});
