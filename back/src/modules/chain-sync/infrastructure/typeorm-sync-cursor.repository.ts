import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
import { SyncCursorRepository } from '../domain/sync-cursor.repository';
import { ChainSyncCursorOrmEntity } from './chain-sync-cursor.orm-entity';

/** Adapter TypeORM du port {@link SyncCursorRepository}. */
@Injectable()
export class TypeOrmSyncCursorRepository extends SyncCursorRepository {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  private get repository(): Repository<ChainSyncCursorOrmEntity> {
    return this.db.getRepository(ChainSyncCursorOrmEntity);
  }

  async getLastProcessedBlock(id: string): Promise<bigint> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? BigInt(entity.lastProcessedBlock) : 0n;
  }

  async setLastProcessedBlock(id: string, block: bigint): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .insert()
      .values({
        id,
        lastProcessedBlock: block.toString(),
        updatedAt: new Date(),
      })
      .orUpdate(['last_processed_block', 'updated_at'], ['id'])
      .execute();
  }
}
