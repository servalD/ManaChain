import { Injectable, Logger } from '@nestjs/common';
import { BlockchainGateway } from '../domain/blockchain-gateway';

/**
 * Adapter {@link BlockchainGateway} par défaut : NE FAIT RIEN (off-chain conservé).
 * Trace en debug le point où la synchronisation on-chain s'insérera. Remplacer
 * par un adapter ethers/viem le jour de la bascule « chaîne = source de vérité ».
 */
@Injectable()
export class NoopBlockchainGateway extends BlockchainGateway {
  private readonly logger = new Logger(NoopBlockchainGateway.name);

  onTokensPurchased(
    tokenId: string,
    userId: string,
    amount: number,
  ): Promise<void> {
    this.logger.debug(
      `[noop] purchase token=${tokenId} user=${userId} amount=${amount}`,
    );
    return Promise.resolve();
  }

  onTokensTransferred(
    tokenId: string,
    fromUserId: string,
    toUserId: string,
    amount: number,
  ): Promise<void> {
    this.logger.debug(
      `[noop] transfer token=${tokenId} from=${fromUserId} to=${toUserId} amount=${amount}`,
    );
    return Promise.resolve();
  }
}
