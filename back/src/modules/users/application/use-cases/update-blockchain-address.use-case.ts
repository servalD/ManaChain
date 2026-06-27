import { Injectable } from '@nestjs/common';
import { User } from '../../domain/user';
import { UserRepository } from '../../domain/user.repository';
import {
  BlockchainAddressAlreadyUsedError,
  UserNotFoundError,
} from '../../domain/user.errors';

/**
 * Rattache (ou met à jour) l'adresse blockchain de l'utilisateur courant.
 * L'unicité de l'adresse est garantie au niveau métier.
 */
@Injectable()
export class UpdateBlockchainAddressUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string, address: string): Promise<User> {
    const current = await this.userRepository.findById(userId);
    if (!current) {
      throw new UserNotFoundError(userId);
    }

    const owner = await this.userRepository.findByBlockchainAddress(address);
    if (owner && owner.id !== userId) {
      throw new BlockchainAddressAlreadyUsedError(address);
    }

    return this.userRepository.updateBlockchainAddress(userId, address);
  }
}
