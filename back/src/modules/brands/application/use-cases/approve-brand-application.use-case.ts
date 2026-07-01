import { Injectable } from '@nestjs/common';
import { TransactionRunner } from '../../../../shared/application/transaction-runner';
import { PasswordHasher } from '../../../auth/application/ports/password-hasher.port';
import { UserRepository } from '../../../users/domain/user.repository';
import { BrandApplicationRepository } from '../../domain/brand-application.repository';
import { BrandRepository } from '../../domain/brand.repository';
import { BrandApplicationMailer } from '../../domain/brand-application-mailer.port';
import { TemporaryPasswordGenerator } from '../../domain/temporary-password-generator';
import {
  ApplicationEmailNotVerifiedError,
  ApplicationNotReviewableError,
  BrandApplicationNotFoundError,
} from '../../domain/brand.errors';

export interface ApproveResult {
  userId: string;
  brandId: string;
}

/**
 * Approuve une candidature : crée le compte BRANDUSER (mot de passe temporaire),
 * la marque (avec ses interests), marque la candidature approuvée, et envoie les
 * identifiants par email.
 *
 * Compte + marque + statut candidature sont écrits ATOMIQUEMENT ({@link
 * TransactionRunner}) : un échec partiel (ex. nom de marque déjà pris) annule
 * tout, sans laisser de compte orphelin. L'email est envoyé APRÈS le commit.
 */
@Injectable()
export class ApproveBrandApplicationUseCase {
  constructor(
    private readonly applicationRepository: BrandApplicationRepository,
    private readonly brandRepository: BrandRepository,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly passwordGenerator: TemporaryPasswordGenerator,
    private readonly mailer: BrandApplicationMailer,
    private readonly tx: TransactionRunner,
  ) {}

  async execute(
    adminUserId: string,
    applicationId: string,
  ): Promise<ApproveResult> {
    const application =
      await this.applicationRepository.findById(applicationId);
    if (!application) {
      throw new BrandApplicationNotFoundError();
    }
    if (!application.canBeReviewed()) {
      throw new ApplicationNotReviewableError();
    }
    if (!application.emailVerified) {
      throw new ApplicationEmailNotVerifiedError();
    }

    const temporaryPassword = this.passwordGenerator.generate();
    const passwordHash = await this.passwordHasher.hash(temporaryPassword);
    const username = await this.uniqueUsername(application.brandName);

    const result = await this.tx.run(async () => {
      const user = await this.userRepository.createBrandUser({
        email: application.contactEmail,
        username,
        firstName: application.contactFirstName,
        lastName: application.contactLastName,
        passwordHash,
      });

      const interestIds =
        await this.applicationRepository.findInterestIds(applicationId);

      const brand = await this.brandRepository.create({
        ownerId: user.id,
        name: application.brandName,
        description: application.description,
        logoUrl: application.logoUrl,
        websiteUrl: application.websiteUrl,
        businessRegistrationNumber: application.businessRegistrationNumber,
        country: application.country,
        headquartersStreet: application.headquartersStreet,
        headquartersCity: application.headquartersCity,
        headquartersZipCode: application.headquartersZipCode,
        headquartersAddressComplement:
          application.headquartersAddressComplement,
        socialMedias: application.socialMediaLinks,
        interestIds,
      });

      await this.applicationRepository.approve(applicationId, adminUserId);
      return { userId: user.id, brandId: brand.id };
    });

    try {
      await this.mailer.sendApproved(
        application.contactEmail,
        application.brandName,
        username,
        temporaryPassword,
      );
    } catch {
      /* email non bloquant */
    }

    return result;
  }

  /** Normalise le nom de marque en username unique (suffixe incrémental si pris). */
  private async uniqueUsername(brandName: string): Promise<string> {
    const base =
      brandName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 30) || 'brand';

    let candidate = base;
    let counter = 1;
    while (await this.userRepository.findByUsername(candidate)) {
      candidate = `${base}${counter}`;
      counter++;
    }
    return candidate;
  }
}
