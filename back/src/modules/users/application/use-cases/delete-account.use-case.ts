import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/user.repository';
import {
  BrandOwnerCannotDeleteAccountError,
  UserNotFoundError,
} from '../../domain/user.errors';
import { TokenTransactionRepository } from '../../../tokens/domain/token-transaction.repository';
import { TransactionRunner } from '../../../../shared/application/transaction-runner';

/**
 * RGPD — suppression de compte (`DELETE /users/me`), au-delà du délink existant
 * ({@link UnlinkUserChainDataUseCase}). Anonymise le compte en place plutôt que
 * de supprimer la ligne (cf. migration `1750000000006-UserAccountDeletion`) :
 * évite les CASCADE (`brand.user_id`) et RESTRICT (`*_ban.banned_by`) de la
 * baseline, préserve l'intégrité de l'historique de transactions.
 *
 * Bloque si le compte possède une marque (`user.isBrand`, tenu à jour par
 * `CreateBrandUseCase`/`DeleteBrandUseCase`) : supprimer un propriétaire de
 * marque détruirait silencieusement tokens/ventes/events pour d'autres
 * utilisateurs (acheteurs, détenteurs de tokens) — la marque doit d'abord être
 * supprimée ou transférée.
 */
@Injectable()
export class DeleteAccountUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenTransactions: TokenTransactionRepository,
    private readonly tx: TransactionRunner,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }
    if (user.isBrand) {
      throw new BrandOwnerCannotDeleteAccountError();
    }

    await this.tx.run(async () => {
      await this.userRepository.setInterestIds(userId, []);
      await this.tokenTransactions.unlinkUser(userId);
      await this.userRepository.anonymize(userId);
    });
  }
}
