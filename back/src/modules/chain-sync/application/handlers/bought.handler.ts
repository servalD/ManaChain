import { Injectable, Logger } from '@nestjs/common';
import { formatUnits } from 'viem';
import { ChainEventHandler } from '../../domain/chain-event-handler';
import { DecodedLog } from '../../domain/chain-reader';
import { TokenSaleRepository } from '../../domain/token-sale.repository';
import { UserRepository } from '../../../users/domain/user.repository';
import { TokenTransactionRepository } from '../../../tokens/domain/token-transaction.repository';
import { TransactionRunner } from '../../../../shared/application/transaction-runner';

/**
 * `Bought` (TokenSaleEscrow) : trace l'achat en `token_transaction` (type
 * `purchase`) et incrémente `sold_amount`. Ne touche PAS `token_holder` — le
 * transfert ERC-20 escrow→acheteur déclenché par `buy()` est repris par
 * {@link Erc20TransferHandler}, seul point de vérité des soldes.
 */
@Injectable()
export class BoughtHandler implements ChainEventHandler {
  readonly eventName = 'Bought';
  private readonly logger = new Logger(BoughtHandler.name);

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
      this.logger.warn(`Bought on unknown escrow ${escrowAddress} — skipped`);
      return;
    }

    const buyerAddress = (log.args.buyer as string).toLowerCase();
    const amountRaw = log.args.amount as bigint;
    const paidRaw = log.args.paid as bigint;
    const amount = Number(formatUnits(amountRaw, 18));
    const paid = Number(formatUnits(paidRaw, 6));
    const pricePerToken = amount > 0 ? paid / amount : null;

    const buyer =
      await this.userRepository.findByBlockchainAddress(buyerAddress);

    await this.tx.run(async () => {
      await this.tokenTransactions.record({
        tokenId: sale.tokenId,
        fromUserId: null,
        toUserId: buyer?.id ?? null,
        amount,
        transactionType: 'purchase',
        pricePerToken,
        txHash: log.transactionHash,
        logIndex: log.logIndex,
        blockNumber: log.blockNumber,
        fromAddress: null,
        toAddress: buyerAddress,
      });
      await this.tokenSales.increaseSold(escrowAddress, amountRaw.toString());
    });
  }
}
