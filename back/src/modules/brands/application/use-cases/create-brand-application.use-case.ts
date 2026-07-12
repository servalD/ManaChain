import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../users/domain/user.repository';
import { SecureTokenGenerator } from '../../../auth/application/ports/secure-token-generator.port';
import { BrandApplication } from '../../domain/brand-application';
import {
  BrandApplicationRepository,
  CreateBrandApplicationParams,
} from '../../domain/brand-application.repository';
import { BrandRepository } from '../../domain/brand.repository';
import { InterestChecker } from '../../domain/interest-checker';
import { BrandApplicationMailer } from '../../domain/brand-application-mailer.port';
import {
  ApplicationBrandNameTakenError,
  ApplicationContactEmailAlreadyRegisteredError,
  InvalidInterestSelectionError,
  RegistrationNumberTakenError,
} from '../../domain/brand.errors';

export type CreateBrandApplicationInput = Omit<
  CreateBrandApplicationParams,
  'emailVerificationToken' | 'emailVerificationExpires'
>;

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Crée une candidature de marque (public) : valide les interests (1–2), l'unicité
 * du SIRET et du nom (candidatures actives + marques existantes), puis envoie
 * l'email de vérification au contact et une notification aux admins (best-effort).
 */
@Injectable()
export class CreateBrandApplicationUseCase {
  constructor(
    private readonly applicationRepository: BrandApplicationRepository,
    private readonly brandRepository: BrandRepository,
    private readonly interestChecker: InterestChecker,
    private readonly tokenGenerator: SecureTokenGenerator,
    private readonly userRepository: UserRepository,
    private readonly mailer: BrandApplicationMailer,
  ) {}

  async execute(
    input: CreateBrandApplicationInput,
    options?: { skipEmailVerification?: boolean },
  ): Promise<BrandApplication> {
    if (input.interestIds.length < 1 || input.interestIds.length > 2) {
      throw new InvalidInterestSelectionError(
        'Select between 1 and 2 interests',
      );
    }
    if (!(await this.interestChecker.allExist(input.interestIds))) {
      throw new InvalidInterestSelectionError(
        'One or more invalid interest IDs',
      );
    }
    if (
      await this.applicationRepository.isRegistrationNumberTaken(
        input.businessRegistrationNumber,
      )
    ) {
      throw new RegistrationNumberTakenError();
    }
    if (
      (await this.applicationRepository.isNameActive(input.brandName)) ||
      (await this.brandRepository.isNameTaken(input.brandName))
    ) {
      throw new ApplicationBrandNameTakenError();
    }
    if (await this.userRepository.findByEmail(input.contactEmail)) {
      throw new ApplicationContactEmailAlreadyRegisteredError();
    }

    const token = this.tokenGenerator.generate();
    let application = await this.applicationRepository.create({
      ...input,
      emailVerificationToken: token,
      emailVerificationExpires: new Date(Date.now() + VERIFICATION_TTL_MS),
    });

    if (options?.skipEmailVerification) {
      application = await this.applicationRepository.markEmailVerified(
        application.id,
      );
    } else {
      await this.notify(application, token);
    }
    return application;
  }

  private async notify(
    application: BrandApplication,
    token: string,
  ): Promise<void> {
    try {
      await this.mailer.sendVerification(
        application.contactEmail,
        application.contactFirstName,
        application.brandName,
        token,
      );
    } catch {
      /* email non bloquant */
    }
    try {
      const admins = await this.userRepository.findAdminEmails();
      for (const adminEmail of admins) {
        await this.mailer.sendAdminNotification(adminEmail, application);
      }
    } catch {
      /* email non bloquant */
    }
  }
}
