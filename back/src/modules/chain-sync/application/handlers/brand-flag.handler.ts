import { ChainEventHandler } from '../../domain/chain-event-handler';
import { DecodedLog } from '../../domain/chain-reader';
import { BrandContractsRepository } from '../../domain/brand-contracts.repository';
import { TransactionRunner } from '../../../../shared/application/transaction-runner';

/**
 * `BrandWhitelisted`/`BrandBlacklisted` (ManaAdmin) : met à jour le flag
 * correspondant sur `brand_contracts`. Une instance par event name, voir
 * `chain-sync.module.ts`.
 */
export class BrandFlagHandler implements ChainEventHandler {
  constructor(
    readonly eventName: string,
    private readonly boolArgName: string,
    private readonly setFlag: 'setWhitelisted' | 'setBlacklisted',
    private readonly brandContracts: BrandContractsRepository,
    private readonly tx: TransactionRunner,
  ) {}

  async handle(log: DecodedLog): Promise<void> {
    const brandAddress = (log.args.brand as string).toLowerCase();
    const value = log.args[this.boolArgName] as boolean;
    await this.tx.run(() =>
      this.brandContracts[this.setFlag](brandAddress, value),
    );
  }
}
