import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
import {
  BrandApplicationProofUploadStore,
  ProofUploadFile,
} from '../domain/brand-application-proof-upload.store';
import { BrandApplicationProofUploadOrmEntity } from './brand-application-proof-upload.orm-entity';

/** Adapter TypeORM du port {@link BrandApplicationProofUploadStore}. */
@Injectable()
export class TypeOrmBrandApplicationProofUploadStore extends BrandApplicationProofUploadStore {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  private get repository(): Repository<BrandApplicationProofUploadOrmEntity> {
    return this.db.getRepository(BrandApplicationProofUploadOrmEntity);
  }

  async create(uploadedBy: string, file: ProofUploadFile): Promise<string> {
    const created = this.repository.create({
      data: file.data,
      mimeType: file.mimeType,
      fileName: file.fileName,
      uploadedBy,
    });
    const saved = await this.repository.save(created);
    return saved.id;
  }

  async consume(uploadId: string): Promise<ProofUploadFile | null> {
    const entity = await this.repository.findOne({
      where: { id: uploadId },
    });
    if (!entity) return null;
    await this.repository.delete({ id: uploadId });
    return {
      data: entity.data,
      mimeType: entity.mimeType,
      fileName: entity.fileName,
    };
  }

  async delete(uploadId: string): Promise<boolean> {
    const result = await this.repository.delete({ id: uploadId });
    return (result.affected ?? 0) > 0;
  }

  async deleteOlderThan(cutoff: Date): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoff', { cutoff })
      .execute();
    return result.affected ?? 0;
  }
}
