import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ReconcileUserChainDataUseCase } from './reconcile-user-chain-data.use-case';
import { USER_BLOCKCHAIN_ADDRESS_LINKED } from '../../users/domain/user.events';
import type { UserBlockchainAddressLinkedEvent } from '../../users/domain/user.events';

/**
 * Découple `UpdateBlockchainAddressUseCase` (module users) de chain-sync :
 * users émet l'event, ce listener réagit — évite un cycle de modules users ↔
 * chain-sync (chain-sync importe déjà users pour ses handlers).
 */
@Injectable()
export class UserBlockchainAddressLinkedListener {
  private readonly logger = new Logger(
    UserBlockchainAddressLinkedListener.name,
  );

  constructor(private readonly reconcile: ReconcileUserChainDataUseCase) {}

  @OnEvent(USER_BLOCKCHAIN_ADDRESS_LINKED)
  async handle(event: UserBlockchainAddressLinkedEvent): Promise<void> {
    try {
      await this.reconcile.execute(event.userId, event.address);
    } catch (error) {
      this.logger.warn(
        `chain-sync reconciliation failed for user ${event.userId}: ${(error as Error).message}`,
      );
    }
  }
}
