import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import {
  DataSource,
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  Repository,
} from 'typeorm';

/**
 * Contexte de persistance partagé. Diffuse, via un {@link AsyncLocalStorage}, l'
 * `EntityManager` de la transaction courante (le cas échéant) à tous les
 * repositories TypeORM. Hors transaction, il retombe sur le manager par défaut du
 * `DataSource`.
 *
 * Les adapters résolvent leur `Repository` via {@link getRepository} plutôt que
 * via un `@InjectRepository` figé : ainsi, un même repo écrit dans la transaction
 * ambiante quand il est appelé depuis {@link TransactionRunner.run}, et en
 * auto-commit sinon — sans changer la signature des ports de domaine.
 */
@Injectable()
export class DatabaseContext {
  private readonly als = new AsyncLocalStorage<EntityManager>();

  constructor(private readonly dataSource: DataSource) {}

  /** `EntityManager` transactionnel courant, ou celui par défaut hors transaction. */
  get manager(): EntityManager {
    return this.als.getStore() ?? this.dataSource.manager;
  }

  /** Manager transactionnel courant s'il y en a un (pour éviter d'imbriquer). */
  get activeManager(): EntityManager | undefined {
    return this.als.getStore();
  }

  getRepository<E extends ObjectLiteral>(
    target: EntityTarget<E>,
  ): Repository<E> {
    return this.manager.getRepository(target);
  }

  /** Exécute `work` avec `manager` comme contexte transactionnel ambiant. */
  run<T>(manager: EntityManager, work: () => Promise<T>): Promise<T> {
    return this.als.run(manager, work);
  }
}
