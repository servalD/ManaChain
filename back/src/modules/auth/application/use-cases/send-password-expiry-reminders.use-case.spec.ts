import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { OAUTH_GOOGLE_PASSWORD_SENTINEL } from '../../../users/domain/user.repository';
import { FakeMailer } from '../test-fakes';
import {
  PASSWORD_ROTATION_DAYS,
  SendPasswordExpiryRemindersUseCase,
} from './send-password-expiry-reminders.use-case';

function daysAgo(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

describe('SendPasswordExpiryRemindersUseCase', () => {
  let repo: InMemoryUserRepository;
  let mailer: FakeMailer;
  let useCase: SendPasswordExpiryRemindersUseCase;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    mailer = new FakeMailer();
    useCase = new SendPasswordExpiryRemindersUseCase(repo, mailer);
  });

  it('reminds users whose password is older than the rotation window', async () => {
    const stale = repo.seed({
      email: 'stale@example.com',
      passwordHash: 'hash',
      passwordChangedAt: daysAgo(PASSWORD_ROTATION_DAYS + 1),
    });

    const sent = await useCase.execute();

    expect(sent).toBe(1);
    expect(mailer.passwordExpiryReminders).toEqual([stale.email]);
  });

  it('does not remind users whose password is recent', async () => {
    repo.seed({
      email: 'fresh@example.com',
      passwordHash: 'hash',
      passwordChangedAt: daysAgo(PASSWORD_ROTATION_DAYS - 1),
    });

    await useCase.execute();

    expect(mailer.passwordExpiryReminders).toEqual([]);
  });

  it('does not remind Google OAuth accounts (no real password to rotate)', async () => {
    repo.seed({
      email: 'google@example.com',
      passwordHash: OAUTH_GOOGLE_PASSWORD_SENTINEL,
      passwordChangedAt: daysAgo(PASSWORD_ROTATION_DAYS + 1),
    });

    await useCase.execute();

    expect(mailer.passwordExpiryReminders).toEqual([]);
  });

  it('does not remind twice within the rotation window', async () => {
    const user = repo.seed({
      email: 'already-reminded@example.com',
      passwordHash: 'hash',
      passwordChangedAt: daysAgo(PASSWORD_ROTATION_DAYS + 1),
    });
    await repo.markPasswordReminderSent(user.id);

    const sent = await useCase.execute();

    expect(sent).toBe(0);
    expect(mailer.passwordExpiryReminders).toEqual([]);
  });
});
