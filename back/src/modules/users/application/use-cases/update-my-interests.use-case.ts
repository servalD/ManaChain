import { Injectable } from '@nestjs/common';
import { TransactionRunner } from '../../../../shared/application/transaction-runner';
import { UserRepository } from '../../domain/user.repository';

/**
 * Remplace intégralement les centres d'intérêt de l'utilisateur courant.
 * L'existence des ids n'est pas re-validée ici (comme dans l'ancien Express) :
 * la contrainte de clé étrangère sur `user_interest.interest_id` rejette les
 * ids invalides.
 */
@Injectable()
export class UpdateMyInterestsUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tx: TransactionRunner,
  ) {}

  execute(userId: string, interestIds: string[]): Promise<void> {
    return this.tx.run(() =>
      this.userRepository.setInterestIds(userId, interestIds),
    );
  }
}
