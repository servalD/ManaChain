import { Injectable, Logger } from '@nestjs/common';
import { formatUnits } from 'viem';
import { ChainEventHandler } from '../../domain/chain-event-handler';
import { DecodedLog } from '../../domain/chain-reader';
import { BrandContractsRepository } from '../../domain/brand-contracts.repository';
import { TokenSaleRepository } from '../../domain/token-sale.repository';
import { UserRepository } from '../../../users/domain/user.repository';
import { TokenRepository } from '../../../tokens/domain/token.repository';
import { TokenHolderRepository } from '../../../tokens/domain/token-holder.repository';
import { TokenTransactionRepository } from '../../../tokens/domain/token-transaction.repository';
import { TransactionRunner } from '../../../../shared/application/transaction-runner';
import { ZERO_ADDRESS } from '../../infrastructure/abis';

/**
 * `Transfer` (BrandSupportToken, ERC-20) : seul point de vérité des soldes
 * (`token_holder`), par delta et "users connus seulement" — un solde n'est
 * upserté que pour le côté qui correspond à un `user.blockchain_address`
 * connu ; sinon il est différé au job de réconciliation déclenché par
 * `PUT /users/me/blockchain-address`.
 *
 * N'enregistre PAS de `token_transaction` pour les mouvements déjà tracés
 * ailleurs (mint vers l'escrow au `mintSupport`, achat/refund escrow⇄user,
 * déjà couverts par {@link BoughtHandler}/{@link RefundClaimedHandler}) — sinon
 * un simple transfert P2P entre deux users connus.
 */
@Injectable()
export class Erc20TransferHandler implements ChainEventHandler {
  readonly eventName = 'Transfer';
  private readonly logger = new Logger(Erc20TransferHandler.name);

  constructor(
    private readonly brandContracts: BrandContractsRepository,
    private readonly tokenSales: TokenSaleRepository,
    private readonly userRepository: UserRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly tokenHolders: TokenHolderRepository,
    private readonly tokenTransactions: TokenTransactionRepository,
    private readonly tx: TransactionRunner,
  ) {}

  async handle(log: DecodedLog): Promise<void> {
    const supportTokenAddress = log.address.toLowerCase();
    const brandContracts =
      await this.brandContracts.findBySupportTokenAddress(supportTokenAddress);
    if (!brandContracts?.brandId) return;
    const token = await this.tokenRepository.findByBrandId(
      brandContracts.brandId,
    );
    if (!token) return;

    const from = (log.args.from as string).toLowerCase();
    const to = (log.args.to as string).toLowerCase();
    const valueRaw = log.args.value as bigint;
    const amount = Number(formatUnits(valueRaw, 18));
    const isMint = from === ZERO_ADDRESS;
    const isBurn = to === ZERO_ADDRESS;

    const escrowAddresses = new Set(
      await this.tokenSales.listAllEscrowAddresses(),
    );
    const isEscrowLeg = escrowAddresses.has(from) || escrowAddresses.has(to);

    const [fromUser, toUser] = await Promise.all([
      isMint ? null : this.userRepository.findByBlockchainAddress(from),
      isBurn ? null : this.userRepository.findByBlockchainAddress(to),
    ]);

    await this.tx.run(async () => {
      if (isMint) {
        await this.tokenRepository.increaseSupply(token.id, amount);
      }
      if (fromUser && !isMint) {
        const balance = await this.tokenHolders.getBalanceForUpdate(
          fromUser.id,
          token.id,
        );
        await this.tokenHolders.setBalance(
          fromUser.id,
          token.id,
          Math.max(0, balance - amount),
        );
      }
      if (toUser && !isBurn) {
        const balance = await this.tokenHolders.getBalanceForUpdate(
          toUser.id,
          token.id,
        );
        await this.tokenHolders.setBalance(
          toUser.id,
          token.id,
          balance + amount,
        );
      }

      // Achat/refund escrow<->user déjà tracés par Bought/RefundClaimed ; mint
      // vers l'escrow déjà couvert par le compteur de supply ci-dessus.
      if (isEscrowLeg || isMint || isBurn) return;

      await this.tokenTransactions.record({
        tokenId: token.id,
        fromUserId: fromUser?.id ?? null,
        toUserId: toUser?.id ?? null,
        amount,
        transactionType: 'transfer',
        pricePerToken: null,
        txHash: log.transactionHash,
        logIndex: log.logIndex,
        blockNumber: log.blockNumber,
        fromAddress: from,
        toAddress: to,
      });
    });

    if (!fromUser && !toUser) {
      this.logger.debug(
        `Transfer ${from} -> ${to} on ${supportTokenAddress}: neither side is a known user`,
      );
    }
  }
}
