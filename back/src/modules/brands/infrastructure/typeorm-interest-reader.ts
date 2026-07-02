import { Injectable } from '@nestjs/common';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
import { InterestReader, InterestSummary } from '../domain/interest-reader';

/** Adapter {@link InterestReader} : lit la table `interest` triée par libellé. */
@Injectable()
export class TypeOrmInterestReader extends InterestReader {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  listAll(): Promise<InterestSummary[]> {
    return this.db.manager.query<InterestSummary[]>(
      `SELECT id, label, icon FROM interest ORDER BY label`,
    );
  }
}
