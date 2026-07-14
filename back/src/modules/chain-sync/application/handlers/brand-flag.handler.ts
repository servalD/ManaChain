import { ChainEventHandler } from '../../domain/chain-event-handler';
import { DecodedLog } from '../../domain/chain-reader';
import { BrandContractsRepository } from '../../domain/brand-contracts.repository';
import { TransactionRunner } from '../../../../shared/application/transaction-runner';
import { UserRepository } from '../../../users/domain/user.repository';
import { NotificationRepository } from '../../../notifications/domain/notification.repository';
import { bestEffort } from '../../../../shared/application/best-effort';

/**
 * `BrandWhitelisted`/`BrandBlacklisted` (ManaAdmin) : met à jour le flag
 * correspondant sur `brand_contracts`. Une instance par event name, voir
 * `chain-sync.module.ts`. Notifie en plus le propriétaire quand sa marque
 * vient d'être whitelistée ({@link bestEffort}, ne bloque jamais l'écriture DB).
 */
export class BrandFlagHandler implements ChainEventHandler {
  constructor(
    readonly eventName: string,
    private readonly boolArgName: string,
    private readonly setFlag: 'setWhitelisted' | 'setBlacklisted',
    private readonly brandContracts: BrandContractsRepository,
    private readonly tx: TransactionRunner,
    private readonly userRepository: UserRepository,
    private readonly notifications: NotificationRepository,
  ) {}

  async handle(log: DecodedLog): Promise<void> {
    const brandAddress = (log.args.brand as string).toLowerCase();
    const value = log.args[this.boolArgName] as boolean;
    await this.tx.run(() =>
      this.brandContracts[this.setFlag](brandAddress, value),
    );

    if (this.setFlag === 'setWhitelisted' && value) {
      await this.notifyOwner(brandAddress);
    }
  }

  private notifyOwner(brandAddress: string): Promise<void> {
    return bestEffort('brand whitelisted notification', async () => {
      const owner =
        await this.userRepository.findByBlockchainAddress(brandAddress);
      if (!owner) return;
      await this.notifications.create({
        userId: owner.id,
        type: 'brand_whitelisted',
        title: 'Your brand has been whitelisted',
        body: 'Your brand is now whitelisted on-chain and can open token sales.',
      });
    });
  }
}
