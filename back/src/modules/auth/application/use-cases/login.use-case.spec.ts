import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import {
  EmailNotVerifiedError,
  InvalidCredentialsError,
} from '../../domain/auth.errors';
import { FakeAppTokenService, FakePasswordHasher } from '../test-fakes';
import { LoginUseCase } from './login.use-case';

describe('LoginUseCase', () => {
  let repo: InMemoryUserRepository;
  let useCase: LoginUseCase;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    useCase = new LoginUseCase(
      repo,
      new FakePasswordHasher(),
      new FakeAppTokenService(),
    );
  });

  it('signs a token for valid, verified credentials', async () => {
    const user = repo.seed({
      email: 'ada@example.com',
      verified: true,
      passwordHash: 'hashed:S3cret!pwd',
    });

    const result = await useCase.execute('ada@example.com', 'S3cret!pwd');

    expect(result.token).toBe(`jwt:${user.id}`);
    expect(result.user.id).toBe(user.id);
  });

  it('rejects an unknown email', async () => {
    await expect(
      useCase.execute('nobody@example.com', 'x'),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects an unverified account', async () => {
    repo.seed({
      email: 'ada@example.com',
      verified: false,
      passwordHash: 'hashed:S3cret!pwd',
    });
    await expect(
      useCase.execute('ada@example.com', 'S3cret!pwd'),
    ).rejects.toBeInstanceOf(EmailNotVerifiedError);
  });

  it('rejects a wrong password', async () => {
    repo.seed({
      email: 'ada@example.com',
      verified: true,
      passwordHash: 'hashed:S3cret!pwd',
    });
    await expect(
      useCase.execute('ada@example.com', 'wrong'),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
