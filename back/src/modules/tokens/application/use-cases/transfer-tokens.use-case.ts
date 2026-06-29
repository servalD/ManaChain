import { Injectable } from '@nestjs/common';
import { User } from '../../../users/domain/user';
import { TokenRepository } from '../../domain/token.repository';
import { TokenHolderRepository } from '../../domain/token-holder.repository';
import { TokenTransactionRepository } from '../../domain/token-transaction.repository';
import { BlockchainGateway } from '../../domain/blockchain-gateway';
import {
  AccountNotVerifiedError,
  InsufficientBalanceError,
  InvalidAmountError,
  SelfTransferError,
  TokenNotFoundError,
} from '../../domain/token.errors';

/**
 * Transfère des tokens entre utilisateurs (off-chain : débit/crédit en base).
 * Le hook {@link BlockchainGateway} est appelé après le mouvement (no-op pour
 * l'instant). NB : non transactionnel — à renforcer ultérieurement.
 */
@Injectable()
export class TransferTokensUseCase {
  constructor(
    private readonly tokenRepository: TokenRepository,
    private readonly holderRepository: TokenHolderRepository,
    private readonly transactionRepository: TokenTransactionRepository,
    private readonly blockchain: BlockchainGateway,
  ) {}

  async execute(
    requester: User,
    tokenId: string,
    toUserId: string,
    amount: number,
  ): Promise<void> {
    if (!requester.verified) {
      throw new AccountNotVerifiedError();
    }
    if (amount <= 0) {
      throw new InvalidAmountError();
    }
    if (requester.id === toUserId) {
      throw new SelfTransferError();
    }
    if (!(await this.tokenRepository.findById(tokenId))) {
      throw new TokenNotFoundError();
    }

    const senderBalance = await this.holderRepository.getBalance(
      requester.id,
      tokenId,
    );
    if (senderBalance < amount) {
      throw new InsufficientBalanceError();
    }

    const receiverBalance = await this.holderRepository.getBalance(
      toUserId,
      tokenId,
    );
    await this.holderRepository.setBalance(
      requester.id,
      tokenId,
      senderBalance - amount,
    );
    await this.holderRepository.setBalance(
      toUserId,
      tokenId,
      receiverBalance + amount,
    );

    await this.transactionRepository.record({
      tokenId,
      fromUserId: requester.id,
      toUserId,
      amount,
      transactionType: 'transfer',
    });

    await this.blockchain.onTokensTransferred(
      tokenId,
      requester.id,
      toUserId,
      amount,
    );
  }
}
