import { Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
import { BrandApplication } from '../domain/brand-application';
import {
  ApplicationWithExpiry,
  BrandApplicationRepository,
  CreateBrandApplicationParams,
  ListApplicationsParams,
  RegistrationProofFile,
} from '../domain/brand-application.repository';
import { BrandApplicationNotFoundError } from '../domain/brand.errors';
import { BrandApplicationOrmEntity } from './brand-application.orm-entity';

interface InterestIdRow {
  interest_id: string;
}

const ACTIVE_STATUSES = ['pending', 'approved', 'needs_review'];

/** Adapter TypeORM du port {@link BrandApplicationRepository}. */
@Injectable()
export class TypeOrmBrandApplicationRepository extends BrandApplicationRepository {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  private get repository(): Repository<BrandApplicationOrmEntity> {
    return this.db.getRepository(BrandApplicationOrmEntity);
  }

  async isRegistrationNumberTaken(num: string): Promise<boolean> {
    return this.repository.existsBy({ businessRegistrationNumber: num });
  }

  async isNameActive(brandName: string): Promise<boolean> {
    return this.repository.existsBy({
      brandName,
      status: In(ACTIVE_STATUSES),
    });
  }

  async create(
    params: CreateBrandApplicationParams,
  ): Promise<BrandApplication> {
    const created = this.repository.create({
      contactEmail: params.contactEmail,
      contactFirstName: params.contactFirstName,
      contactLastName: params.contactLastName,
      contactPhone: params.contactPhone ?? null,
      brandName: params.brandName,
      description: params.description ?? null,
      websiteUrl: params.websiteUrl ?? null,
      logoUrl: params.logoUrl ?? null,
      businessRegistrationNumber: params.businessRegistrationNumber,
      country: params.country,
      headquartersStreet: params.headquartersStreet,
      headquartersCity: params.headquartersCity,
      headquartersZipCode: params.headquartersZipCode,
      headquartersAddressComplement:
        params.headquartersAddressComplement ?? null,
      motivation: params.motivation ?? null,
      estimatedCommunitySize: params.estimatedCommunitySize ?? null,
      socialMediaLinks: params.socialMediaLinks ?? null,
      howDidYouHearAboutUs: params.howDidYouHearAboutUs ?? null,
      registrationProofData: params.registrationProofData ?? null,
      registrationProofMimeType: params.registrationProofMimeType ?? null,
      registrationProofFileName: params.registrationProofFileName ?? null,
      status: 'pending',
      emailVerified: false,
      emailVerificationToken: params.emailVerificationToken,
      emailVerificationExpires: params.emailVerificationExpires,
    });
    const saved = await this.repository.save(created);
    for (const interestId of params.interestIds) {
      await this.repository.manager.query(
        `INSERT INTO brand_application_interest (brand_application_id, interest_id)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [saved.id, interestId],
      );
    }
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<BrandApplication | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByVerificationToken(
    token: string,
  ): Promise<ApplicationWithExpiry | null> {
    const entity = await this.repository.findOne({
      where: { emailVerificationToken: token },
    });
    if (!entity) return null;
    return {
      application: this.toDomain(entity),
      expiresAt: entity.emailVerificationExpires,
    };
  }

  async markEmailVerified(id: string): Promise<BrandApplication> {
    await this.repository.update(
      { id },
      {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    );
    return this.getOrThrow(id);
  }

  async list(
    params: ListApplicationsParams,
  ): Promise<{ applications: BrandApplication[]; total: number }> {
    const qb = this.repository.createQueryBuilder('a');
    if (params.status) {
      qb.andWhere('a.status = :status', { status: params.status });
    }
    if (params.search) {
      qb.andWhere(
        '(a.contact_email ILIKE :s OR a.brand_name ILIKE :s OR a.id::text ILIKE :s)',
        { s: `%${params.search}%` },
      );
    }
    qb.orderBy('a.created_at', 'DESC').skip(params.offset).take(params.limit);

    const [entities, total] = await qb.getManyAndCount();
    return { applications: entities.map((e) => this.toDomain(e)), total };
  }

  async findInterestIds(applicationId: string): Promise<string[]> {
    const rows = await this.repository.manager.query<InterestIdRow[]>(
      `SELECT interest_id FROM brand_application_interest
       WHERE brand_application_id = $1`,
      [applicationId],
    );
    return rows.map((r) => r.interest_id);
  }

  async findRegistrationProofFile(
    id: string,
  ): Promise<RegistrationProofFile | null> {
    const entity = await this.repository
      .createQueryBuilder('a')
      .select([
        'a.id',
        'a.registrationProofData',
        'a.registrationProofMimeType',
        'a.registrationProofFileName',
      ])
      .where('a.id = :id', { id })
      .getOne();
    if (!entity?.registrationProofData) return null;
    return {
      data: entity.registrationProofData,
      mimeType: entity.registrationProofMimeType ?? 'application/octet-stream',
      fileName: entity.registrationProofFileName ?? 'registration-proof.pdf',
    };
  }

  async approve(id: string, adminUserId: string): Promise<void> {
    await this.repository.update(
      { id },
      { status: 'approved', reviewedBy: adminUserId, reviewedAt: new Date() },
    );
  }

  async reject(
    id: string,
    adminUserId: string,
    rejectionReason: string,
  ): Promise<void> {
    await this.repository.update(
      { id },
      {
        status: 'rejected',
        rejectionReason,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      },
    );
  }

  private async getOrThrow(id: string): Promise<BrandApplication> {
    const found = await this.findById(id);
    if (!found) {
      throw new BrandApplicationNotFoundError();
    }
    return found;
  }

  private toDomain(e: BrandApplicationOrmEntity): BrandApplication {
    return new BrandApplication(
      e.id,
      e.contactEmail,
      e.contactFirstName,
      e.contactLastName,
      e.contactPhone,
      e.brandName,
      e.description,
      e.websiteUrl,
      e.logoUrl,
      e.businessRegistrationNumber,
      e.country,
      e.headquartersStreet,
      e.headquartersCity,
      e.headquartersZipCode,
      e.headquartersAddressComplement,
      e.motivation,
      e.estimatedCommunitySize,
      e.socialMediaLinks,
      e.howDidYouHearAboutUs,
      e.registrationProofFileName,
      e.status,
      e.emailVerified,
      e.rejectionReason,
      e.createdAt,
      e.updatedAt,
    );
  }
}
