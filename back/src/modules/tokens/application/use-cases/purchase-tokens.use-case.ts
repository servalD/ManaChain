import { Injectable } from '@nestjs/common';
import { User } from '../../../users/domain/user';
import { TransactionRunner } from '../../../../shared/application/transaction-runner';
import { TokenRepository } from '../../domain/token.repository';
import { TokenHolderRepository } from '../../domain/token-holder.repository';
import { TokenTransactionRepository } from '../../domain/token-transaction.repository';
import { BlockchainGateway } from '../../domain/blockchain-gateway';
import {
  AccountNotVerifiedError,
  InvalidAmountError,
  InvalidPriceError,
  TokenNotFoundError,
} from '../../domain/token.errors';

/**
 * Achat (émission primaire) de tokens : crédite le solde de l'acheteur et
 * augmente le total supply (off-chain). Crédit + supply + transaction sont
 * ATOMIQUES ({@link TransactionRunner}), le solde acheteur verrouillé. Hook
 * {@link BlockchainGateway} APRÈS le commit.
 */
@Injectable()
export class PurchaseTokensUseCase {
  constructor(
    private readonly tokenRepository: TokenRepository,
    private readonly holderRepository: TokenHolderRepository,
    private readonly transactionRepository: TokenTransactionRepository,
    private readonly blockchain: BlockchainGateway,
    private readonly tx: TransactionRunner,
  ) {}

  async execute(
    requester: User,
    tokenId: string,
    amount: number,
    pricePerToken: string,
  ): Promise<void> {
    if (!requester.verified) {
      throw new AccountNotVerifiedError();
    }
    if (amount <= 0) {
      throw new InvalidAmountError();
    }
    if (Number.isNaN(Number(pricePerToken)) || Number(pricePerToken) < 0) {
      throw new InvalidPriceError();
    }
    if (!(await this.tokenRepository.findById(tokenId))) {
      throw new TokenNotFoundError();
    }

    await this.tx.run(async () => {
      const current = await this.holderRepository.getBalanceForUpdate(
        requester.id,
        tokenId,
      );
      await this.holderRepository.setBalance(
        requester.id,
        tokenId,
        current + amount,
      );
      await this.tokenRepository.increaseSupply(tokenId, amount);
      await this.transactionRepository.record({
        tokenId,
        fromUserId: null,
        toUserId: requester.id,
        amount,
        transactionType: 'purchase',
        pricePerToken: Number(pricePerToken),
      });
    });

    await this.blockchain.onTokensPurchased(tokenId, requester.id, amount);
  }
}
