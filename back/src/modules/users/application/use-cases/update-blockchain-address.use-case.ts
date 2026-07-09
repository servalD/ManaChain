import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from '../../domain/user';
import { UserRepository } from '../../domain/user.repository';
import {
  BlockchainAddressAlreadyUsedError,
  UserNotFoundError,
} from '../../domain/user.errors';
import { USER_BLOCKCHAIN_ADDRESS_LINKED } from '../../domain/user.events';

/**
 * Rattache (ou met à jour) l'adresse blockchain de l'utilisateur courant.
 * L'unicité de l'adresse est garantie au niveau métier. Émet ensuite
 * `USER_BLOCKCHAIN_ADDRESS_LINKED` : chain-sync l'écoute pour rattraper ce
 * qu'il n'a pas pu résoudre au moment des events (liaison `brand_contracts`,
 * recalcul des soldes) — découplé via event plutôt qu'injecté directement,
 * pour ne pas créer de cycle de modules users ↔ chain-sync (qui importe déjà
 * users pour ses handlers).
 */
@Injectable()
export class UpdateBlockchainAddressUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly events: EventEmitter2,
  ) {}

  async execute(userId: string, address: string): Promise<User> {
    const current = await this.userRepository.findById(userId);
    if (!current) {
      throw new UserNotFoundError(userId);
    }

    const owner = await this.userRepository.findByBlockchainAddress(address);
    if (owner && owner.id !== userId) {
      throw new BlockchainAddressAlreadyUsedError(address);
    }

    const updated = await this.userRepository.updateBlockchainAddress(
      userId,
      address,
    );
    this.events.emit(USER_BLOCKCHAIN_ADDRESS_LINKED, { userId, address });
    return updated;
  }
}
