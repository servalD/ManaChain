import { Injectable, Logger } from '@nestjs/common';
import { formatUnits } from 'viem';
import { ChainEventHandler } from '../../domain/chain-event-handler';
import { DecodedLog } from '../../domain/chain-reader';
import { TokenSaleRepository } from '../../domain/token-sale.repository';
import { UserRepository } from '../../../users/domain/user.repository';
import { TokenTransactionRepository } from '../../../tokens/domain/token-transaction.repository';
import { TransactionRunner } from '../../../../shared/application/transaction-runner';

/**
 * `RefundClaimed` (TokenSaleEscrow) : trace le remboursement en
 * `token_transaction` (type `refund`) et décrémente `sold_amount` (les tokens
 * retournent au pool vendable de l'escrow). Le mouvement ERC-20 acheteur→escrow
 * associé est repris par {@link Erc20TransferHandler}.
 */
@Injectable()
export class RefundClaimedHandler implements ChainEventHandler {
  readonly eventName = 'RefundClaimed';
  private readonly logger = new Logger(RefundClaimedHandler.name);

  constructor(
    private readonly tokenSales: TokenSaleRepository,
    private readonly userRepository: UserRepository,
    private readonly tokenTransactions: TokenTransactionRepository,
    private readonly tx: TransactionRunner,
  ) {}

  async handle(log: DecodedLog): Promise<void> {
    const escrowAddress = log.address.toLowerCase();
    const sale = await this.tokenSales.findByEscrowAddress(escrowAddress);
    if (!sale) {
      this.logger.warn(
        `RefundClaimed on unknown escrow ${escrowAddress} — skipped`,
      );
      return;
    }

    const userAddress = (log.args.user as string).toLowerCase();
    const tokenAmountRaw = log.args.tokenAmount as bigint;
    const refundAmountRaw = log.args.refundAmount as bigint;
    const tokenAmount = Number(formatUnits(tokenAmountRaw, 18));
    const refundAmount = Number(formatUnits(refundAmountRaw, 6));
    const pricePerToken = tokenAmount > 0 ? refundAmount / tokenAmount : null;

    const user = await this.userRepository.findByBlockchainAddress(userAddress);

    await this.tx.run(async () => {
      await this.tokenTransactions.record({
        tokenId: sale.tokenId,
        fromUserId: user?.id ?? null,
        toUserId: null,
        amount: tokenAmount,
        transactionType: 'refund',
        pricePerToken,
        txHash: log.transactionHash,
        logIndex: log.logIndex,
        blockNumber: log.blockNumber,
        fromAddress: userAddress,
        toAddress: null,
      });
      await this.tokenSales.increaseSold(
        escrowAddress,
        (-tokenAmountRaw).toString(),
      );
    });
  }
}
