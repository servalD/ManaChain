import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionRunner } from '../../shared/application/transaction-runner';
import { DatabaseContext } from './database-context';

/**
 * Adapter {@link TransactionRunner} sur le `DataSource` TypeORM. Ouvre une
 * transaction et publie son `EntityManager` dans le {@link DatabaseContext} le
 * temps du bloc. Si une transaction est déjà active (appel imbriqué), on la
 * rejoint au lieu d'en ouvrir une seconde indépendante.
 */
@Injectable()
export class TypeOrmTransactionRunner extends TransactionRunner {
  constructor(
    private readonly dataSource: DataSource,
    private readonly context: DatabaseContext,
  ) {
    super();
  }

  run<T>(work: () => Promise<T>): Promise<T> {
    if (this.context.activeManager) {
      return work();
    }
    return this.dataSource.transaction((manager) =>
      this.context.run(manager, work),
    );
  }
}
