import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { UsernameAlreadyTakenError } from '../../../users/domain/user.errors';
import { EmailAlreadyRegisteredError } from '../../domain/auth.errors';
import {
  FakeMailer,
  FakePasswordHasher,
  FakeTokenGenerator,
} from '../test-fakes';
import { RegisterUseCase } from './register.use-case';

describe('RegisterUseCase', () => {
  let repo: InMemoryUserRepository;
  let mailer: FakeMailer;
  let useCase: RegisterUseCase;

  const input = {
    email: 'ada@example.com',
    username: 'ada_l',
    firstName: 'Ada',
    lastName: 'Lovelace',
    password: 'S3cret!pwd',
    ageRange: '25-34',
  };

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    mailer = new FakeMailer();
    useCase = new RegisterUseCase(
      repo,
      new FakePasswordHasher(),
      new FakeTokenGenerator(),
      mailer,
    );
  });

  it('creates an unverified user and sends a verification email', async () => {
    const user = await useCase.execute(input);

    expect(user.verified).toBe(false);
    expect(user.email).toBe(input.email);
    expect(mailer.verifications).toHaveLength(1);
    expect(mailer.verifications[0].to).toBe(input.email);
  });

  it('rejects a duplicate email', async () => {
    repo.seed({ email: input.email });
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      EmailAlreadyRegisteredError,
    );
  });

  it('rejects a duplicate username', async () => {
    repo.seed({ username: input.username });
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      UsernameAlreadyTakenError,
    );
  });
});
