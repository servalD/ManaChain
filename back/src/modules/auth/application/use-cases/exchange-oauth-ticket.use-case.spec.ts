import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { InMemoryUserBanRepository } from '../../../users/application/test-fakes';
import { UserBannedError } from '../../../users/domain/user.errors';
import { InvalidOrExpiredOAuthTicketError } from '../../domain/auth.errors';
import {
  FakeAppTokenService,
  FakeTokenGenerator,
  InMemoryOAuthLoginTicketRepository,
  InMemoryRefreshTokenRepository,
  InMemoryTwoFactorChallengeRepository,
} from '../test-fakes';
import {
  ExchangeOAuthTicketUseCase,
  ExchangeOAuthTicketSession,
} from './exchange-oauth-ticket.use-case';

describe('ExchangeOAuthTicketUseCase', () => {
  let repo: InMemoryUserRepository;
  let bans: InMemoryUserBanRepository;
  let challenges: InMemoryTwoFactorChallengeRepository;
  let tickets: InMemoryOAuthLoginTicketRepository;
  let refreshTokens: InMemoryRefreshTokenRepository;
  let useCase: ExchangeOAuthTicketUseCase;

  const futureDate = () => new Date(Date.now() + 60_000);
  const pastDate = () => new Date(Date.now() - 60_000);

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    bans = new InMemoryUserBanRepository();
    challenges = new InMemoryTwoFactorChallengeRepository();
    tickets = new InMemoryOAuthLoginTicketRepository();
    refreshTokens = new InMemoryRefreshTokenRepository();
    useCase = new ExchangeOAuthTicketUseCase(
      tickets,
      repo,
      bans,
      challenges,
      new FakeAppTokenService(),
      new FakeTokenGenerator(),
      refreshTokens,
    );
  });

  it('issues a full session directly when 2FA is not enabled', async () => {
    const user = repo.seed({ email: 'ada@example.com' });
    await tickets.create(user.id, 'ticket-1', futureDate());

    const result = (await useCase.execute(
      'ticket-1',
    )) as ExchangeOAuthTicketSession;

    expect(result.twoFactorRequired).toBe(false);
    expect(result.user.id).toBe(user.id);
    expect(result.token).toBe(`jwt:${user.id}`);
  });

  it('returns a challenge instead of a session when 2FA is enabled', async () => {
    const user = repo.seed({
      email: 'ada@example.com',
      twoFactorEnabled: true,
    });
    await tickets.create(user.id, 'ticket-1', futureDate());

    const result = await useCase.execute('ticket-1');

    expect(result.twoFactorRequired).toBe(true);
    if (!result.twoFactorRequired) throw new Error('expected a challenge');
    const challenge = await challenges.find(result.challengeToken);
    expect(challenge?.userId).toBe(user.id);
  });

  it('rejects a ticket reused a second time', async () => {
    const user = repo.seed({ email: 'ada@example.com' });
    await tickets.create(user.id, 'ticket-1', futureDate());

    await useCase.execute('ticket-1');

    await expect(useCase.execute('ticket-1')).rejects.toBeInstanceOf(
      InvalidOrExpiredOAuthTicketError,
    );
  });

  it('rejects an expired ticket', async () => {
    const user = repo.seed({ email: 'ada@example.com' });
    await tickets.create(user.id, 'ticket-1', pastDate());

    await expect(useCase.execute('ticket-1')).rejects.toBeInstanceOf(
      InvalidOrExpiredOAuthTicketError,
    );
  });

  it('rejects an unknown ticket', async () => {
    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      InvalidOrExpiredOAuthTicketError,
    );
  });

  it('rejects a banned user even with a valid ticket', async () => {
    const user = repo.seed({ email: 'ada@example.com' });
    await tickets.create(user.id, 'ticket-1', futureDate());
    await bans.create({
      userId: user.id,
      reason: 'Fraud',
      bannedBy: 'admin-1',
      isPermanent: true,
    });

    await expect(useCase.execute('ticket-1')).rejects.toBeInstanceOf(
      UserBannedError,
    );
  });
});
