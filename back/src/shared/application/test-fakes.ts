import { TransactionRunner } from './transaction-runner';

/** Exécute le bloc sans vraie transaction (fakes in-memory). */
export class FakeTransactionRunner extends TransactionRunner {
  run<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}
