import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { OAUTH_GOOGLE_PASSWORD_SENTINEL } from '../../../users/domain/user.repository';
import { OAuthEmailUsesPasswordError } from '../../domain/auth.errors';
import {
  FakeOAuthProvider,
  FakeTokenGenerator,
  InMemoryOAuthLoginTicketRepository,
} from '../test-fakes';
import { GoogleCallbackUseCase } from './google-callback.use-case';

describe('GoogleCallbackUseCase', () => {
  let repo: InMemoryUserRepository;
  let tickets: InMemoryOAuthLoginTicketRepository;

  const build = (email: string) => {
    repo = new InMemoryUserRepository();
    tickets = new InMemoryOAuthLoginTicketRepository();
    return new GoogleCallbackUseCase(
      new FakeOAuthProvider({ email, firstName: 'Ada', lastName: 'Lovelace' }),
      repo,
      new FakeTokenGenerator(),
      tickets,
    );
  };

  it('issues an exchange ticket for an existing Google account (2FA decided at exchange time)', async () => {
    const useCase = build('ada@example.com');
    const user = repo.seed({
      email: 'ada@example.com',
      verified: true,
      passwordHash: OAUTH_GOOGLE_PASSWORD_SENTINEL,
    });

    const result = await useCase.execute('code');

    expect(result.ticket).toBeTruthy();
    await expect(tickets.redeem(result.ticket)).resolves.toBe(user.id);
  });

  it('creates a Google account on first login and issues a ticket', async () => {
    const useCase = build('new@example.com');

    const result = await useCase.execute('code');

    expect(result.ticket).toBeTruthy();
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
});
