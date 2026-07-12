import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { Role } from '../../../../shared/enums/role.enum';
import { FakeTokenGenerator } from '../../../auth/application/test-fakes';
import { InMemoryBrandRepository } from '../../infrastructure/in-memory-brand.repository';
import { InMemoryBrandApplicationRepository } from '../../infrastructure/in-memory-brand-application.repository';
import {
  ApplicationBrandNameTakenError,
  ApplicationContactEmailAlreadyRegisteredError,
  InvalidInterestSelectionError,
  RegistrationNumberTakenError,
} from '../../domain/brand.errors';
import {
  FakeBrandApplicationMailer,
  FakeInterestChecker,
  InMemoryBrandApplicationProofUploadStore,
} from '../test-fakes';
import { CreateBrandApplicationUseCase } from './create-brand-application.use-case';

describe('CreateBrandApplicationUseCase', () => {
  let apps: InMemoryBrandApplicationRepository;
  let brands: InMemoryBrandRepository;
  let users: InMemoryUserRepository;
  let mailer: FakeBrandApplicationMailer;
  let useCase: CreateBrandApplicationUseCase;

  const input = {
    contactEmail: 'contact@brand.co',
    contactFirstName: 'Jane',
    contactLastName: 'Doe',
    brandName: 'BrandCo',
    businessRegistrationNumber: 'REG-1',
    country: 'FR',
    headquartersStreet: '1 rue X',
    headquartersCity: 'Paris',
    headquartersZipCode: '75001',
    interestIds: ['tech'],
  };

  beforeEach(() => {
    apps = new InMemoryBrandApplicationRepository();
    brands = new InMemoryBrandRepository();
    users = new InMemoryUserRepository();
    mailer = new FakeBrandApplicationMailer();
    useCase = new CreateBrandApplicationUseCase(
      apps,
      brands,
      new FakeInterestChecker(),
      new FakeTokenGenerator(),
      users,
      mailer,
      new InMemoryBrandApplicationProofUploadStore(),
    );
  });

  it('creates an application and notifies contact + admins', async () => {
    users.seed({ email: 'admin@manachain.io', role: Role.ADMIN });

    const application = await useCase.execute(input);

    expect(application.brandName).toBe('BrandCo');
    expect(application.status).toBe('pending');
    expect(mailer.verifications).toContain(input.contactEmail);
    expect(mailer.adminNotifications).toContain('admin@manachain.io');
  });

  it('rejects an invalid interest count', async () => {
    await expect(
      useCase.execute({ ...input, interestIds: ['a', 'b', 'c'] }),
    ).rejects.toBeInstanceOf(InvalidInterestSelectionError);
  });

  it('rejects a duplicate registration number', async () => {
    await useCase.execute(input);
    await expect(
      useCase.execute({ ...input, brandName: 'Other' }),
    ).rejects.toBeInstanceOf(RegistrationNumberTakenError);
  });

  it('rejects a brand name already pending', async () => {
    await useCase.execute(input);
    await expect(
      useCase.execute({ ...input, businessRegistrationNumber: 'REG-2' }),
    ).rejects.toBeInstanceOf(ApplicationBrandNameTakenError);
  });

  it('rejects a contact email already used by an existing account', async () => {
    users.seed({ email: input.contactEmail });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      ApplicationContactEmailAlreadyRegisteredError,
    );
  });
});
