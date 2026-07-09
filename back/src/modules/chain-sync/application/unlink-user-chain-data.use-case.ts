import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../users/domain/user.repository';
import { TokenTransactionRepository } from '../../tokens/domain/token-transaction.repository';
import { TransactionRunner } from '../../../shared/application/transaction-runner';

/**
 * RGPD (D9) : NULL-ifie les liens chaîne d'un utilisateur (`token_transaction
 * .from_user_id`/`.to_user_id`) et efface `user.blockchain_address`. Appelé
 * par la suppression de compte, ou sur demande de l'utilisateur.
 *
 * Ne touche PAS `token_holder` : le solde reste rattaché au `user_id`
 * (colonne NOT NULL, cf. baseline) — la suppression de compte cascade déjà
 * dessus (`ON DELETE CASCADE`) ; ce use-case ne s'applique qu'aux cas où le
 * compte est conservé mais le lien blockchain doit être effacé.
 */
@Injectable()
export class UnlinkUserChainDataUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenTransactions: TokenTransactionRepository,
    private readonly tx: TransactionRunner,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.tx.run(async () => {
      await this.tokenTransactions.unlinkUser(userId);
      await this.userRepository.clearBlockchainAddress(userId);
    });
  }
}
