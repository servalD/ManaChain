import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { FakePasswordHasher } from '../../../auth/application/test-fakes';
import { InMemoryBrandRepository } from '../../infrastructure/in-memory-brand.repository';
import { InMemoryBrandApplicationRepository } from '../../infrastructure/in-memory-brand-application.repository';
import {
  ApplicationEmailNotVerifiedError,
  ApplicationNotReviewableError,
} from '../../domain/brand.errors';
import {
  FakeBrandApplicationMailer,
  FakeTemporaryPasswordGenerator,
} from '../test-fakes';
import { ApproveBrandApplicationUseCase } from './approve-brand-application.use-case';

describe('ApproveBrandApplicationUseCase', () => {
  let apps: InMemoryBrandApplicationRepository;
  let brands: InMemoryBrandRepository;
  let users: InMemoryUserRepository;
  let mailer: FakeBrandApplicationMailer;
  let useCase: ApproveBrandApplicationUseCase;

  beforeEach(() => {
    apps = new InMemoryBrandApplicationRepository();
    brands = new InMemoryBrandRepository();
    users = new InMemoryUserRepository();
    mailer = new FakeBrandApplicationMailer();
    useCase = new ApproveBrandApplicationUseCase(
      apps,
      brands,
      users,
      new FakePasswordHasher(),
      new FakeTemporaryPasswordGenerator(),
      mailer,
    );
  });

  it('creates the brand user + brand and emails credentials', async () => {
    const app = apps.seed(
      { brandName: 'BrandCo', emailVerified: true, status: 'pending' },
      ['tech'],
    );

    const result = await useCase.execute('admin-1', app.id);

    expect(result.userId).toBeDefined();
    expect(result.brandId).toBeDefined();
    await expect(users.findById(result.userId)).resolves.not.toBeNull();
    await expect(brands.findByOwnerId(result.userId)).resolves.not.toBeNull();
    expect(mailer.approvals).toHaveLength(1);
    expect(mailer.approvals[0].password).toBe('Temp1234!@');
  });

  it('refuses an unverified application', async () => {
    const app = apps.seed({ emailVerified: false, status: 'pending' });
    await expect(useCase.execute('admin-1', app.id)).rejects.toBeInstanceOf(
      ApplicationEmailNotVerifiedError,
    );
  });

  it('refuses an already-approved application', async () => {
    const app = apps.seed({ emailVerified: true, status: 'approved' });
    await expect(useCase.execute('admin-1', app.id)).rejects.toBeInstanceOf(
      ApplicationNotReviewableError,
    );
  });
});
