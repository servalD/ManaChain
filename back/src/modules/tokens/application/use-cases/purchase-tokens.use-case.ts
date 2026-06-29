import { Injectable } from '@nestjs/common';
import { User } from '../../../users/domain/user';
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
 * augmente le total supply (off-chain). Hook {@link BlockchainGateway} après coup.
 */
@Injectable()
export class PurchaseTokensUseCase {
  constructor(
    private readonly tokenRepository: TokenRepository,
    private readonly holderRepository: TokenHolderRepository,
    private readonly transactionRepository: TokenTransactionRepository,
    private readonly blockchain: BlockchainGateway,
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

    const current = await this.holderRepository.getBalance(
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
    });

    await this.blockchain.onTokensPurchased(tokenId, requester.id, amount);
  }
}
