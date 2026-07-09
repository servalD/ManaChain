import { Injectable } from '@nestjs/common';
import { ChainEventHandler } from '../../domain/chain-event-handler';
import { ChainReader, DecodedLog } from '../../domain/chain-reader';
import { BrandContractsRepository } from '../../domain/brand-contracts.repository';
import { UserRepository } from '../../../users/domain/user.repository';
import { BrandRepository } from '../../../brands/domain/brand.repository';
import { TokenRepository } from '../../../tokens/domain/token.repository';
import { TransactionRunner } from '../../../../shared/application/transaction-runner';
import { erc20Abi } from '../../infrastructure/abis';

/**
 * `BrandModuleDeployed` (BrandFactory) : enregistre `brand_contracts` et, si la
 * marque est déjà résolvable (wallet lié), crée son `brand_token` (symbole lu
 * on-chain). Sinon, la liaison + création du token sont différées au job de
 * réconciliation déclenché par `PUT /users/me/blockchain-address`.
 */
@Injectable()
export class BrandModuleDeployedHandler implements ChainEventHandler {
  readonly eventName = 'BrandModuleDeployed';

  constructor(
    private readonly chainReader: ChainReader,
    private readonly brandContracts: BrandContractsRepository,
    private readonly userRepository: UserRepository,
    private readonly brandRepository: BrandRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly tx: TransactionRunner,
  ) {}

  async handle(log: DecodedLog): Promise<void> {
    const brandAddress = (log.args.brand as string).toLowerCase();
    if (await this.brandContracts.findByBrandAddress(brandAddress)) return;

    const genesisNftAddress = (log.args.genesisNFT as string).toLowerCase();
    const vaultAddress = (log.args.vault as string).toLowerCase();
    const supportTokenAddress = (log.args.supportToken as string).toLowerCase();

    const user =
      await this.userRepository.findByBlockchainAddress(brandAddress);
    const brand = user
      ? await this.brandRepository.findByOwnerId(user.id)
      : null;

    // Lecture RPC en dehors de la transaction DB (cf. TransactionRunner : les
    // effets non-DB restent hors du bloc — ici c'est une lecture pure, sans
    // risque de corruption en cas de rollback, mais on garde la discipline).
    const symbol = brand
      ? await this.chainReader.readContract<string>({
          address: supportTokenAddress,
          abi: erc20Abi,
          functionName: 'symbol',
        })
      : null;

    await this.tx.run(async () => {
      await this.brandContracts.create({
        brandId: brand?.id ?? null,
        brandAddress,
        genesisNftAddress,
        vaultAddress,
        supportTokenAddress,
        deployTxHash: log.transactionHash,
        blockNumber: log.blockNumber,
      });

      if (
        brand &&
        symbol &&
        !(await this.tokenRepository.existsByBrandId(brand.id))
      ) {
        await this.tokenRepository.create({
          brandId: brand.id,
          symbol,
          totalSupply: 0,
          currentPrice: '0',
        });
      }
    });
  }
}
