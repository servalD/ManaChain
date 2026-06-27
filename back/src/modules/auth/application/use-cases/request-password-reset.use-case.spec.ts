import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { FakeMailer, FakeTokenGenerator } from '../test-fakes';
import { RequestPasswordResetUseCase } from './request-password-reset.use-case';

describe('RequestPasswordResetUseCase', () => {
  let repo: InMemoryUserRepository;
  let mailer: FakeMailer;
  let useCase: RequestPasswordResetUseCase;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    mailer = new FakeMailer();
    useCase = new RequestPasswordResetUseCase(
      repo,
      new FakeTokenGenerator(),
      mailer,
    );
  });

  it('sends a reset email when the account exists', async () => {
    repo.seed({ email: 'ada@example.com' });
    await useCase.execute('ada@example.com');
    expect(mailer.resets).toHaveLength(1);
    expect(mailer.resets[0].to).toBe('ada@example.com');
  });

  it('stays silent (no throw, no email) for an unknown email — anti-enumeration', async () => {
    await expect(
      useCase.execute('nobody@example.com'),
    ).resolves.toBeUndefined();
    expect(mailer.resets).toHaveLength(0);
  });
});
