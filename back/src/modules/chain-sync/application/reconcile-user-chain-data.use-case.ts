import { Injectable, Logger } from '@nestjs/common';
import { formatUnits } from 'viem';
import { BrandContractsRepository } from '../domain/brand-contracts.repository';
import { BrandRepository } from '../../brands/domain/brand.repository';
import { TokenRepository } from '../../tokens/domain/token.repository';
import { TokenHolderRepository } from '../../tokens/domain/token-holder.repository';
import { TransactionRunner } from '../../../shared/application/transaction-runner';
import { ChainReader } from '../domain/chain-reader';
import { erc20Abi } from '../infrastructure/abis';

/**
 * Rattrape ce que chain-sync n'a pas pu résoudre au moment des events parce
 * que l'adresse blockchain de l'utilisateur n'était pas encore liée : appelé
 * après `PUT /users/me/blockchain-address` (voir
 * `UpdateBlockchainAddressUseCase`).
 *
 * - Si l'adresse correspond à une marque déployée non liée (`brand_contracts`
 *   avec `brand_id IS NULL`) : lie `brand_contracts` et crée le `brand_token`
 *   manquant (symbole lu on-chain) si l'utilisateur a bien une marque.
 * - Recalcule le solde de l'utilisateur pour chaque support token connu, en
 *   relisant `balanceOf(address)` directement on-chain (plus simple et plus
 *   sûr que de rejouer l'historique des `Transfer`).
 */
@Injectable()
export class ReconcileUserChainDataUseCase {
  private readonly logger = new Logger(ReconcileUserChainDataUseCase.name);

  constructor(
    private readonly chainReader: ChainReader,
    private readonly brandContracts: BrandContractsRepository,
    private readonly brandRepository: BrandRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly tokenHolders: TokenHolderRepository,
    private readonly tx: TransactionRunner,
  ) {}

  async execute(userId: string, address: string): Promise<void> {
    const normalized = address.toLowerCase();
    await this.reconcileBrandLink(userId, normalized);
    await this.reconcileHoldings(userId, normalized);
  }

  private async reconcileBrandLink(
    userId: string,
    address: string,
  ): Promise<void> {
    const contracts = await this.brandContracts.findByBrandAddress(address);
    if (!contracts || contracts.brandId) return;

    const brand = await this.brandRepository.findByOwnerId(userId);
    if (!brand) return;

    const symbol = await this.chainReader
      .readContract<string>({
        address: contracts.supportTokenAddress,
        abi: erc20Abi,
        functionName: 'symbol',
      })
      .catch((error: Error) => {
        this.logger.warn(
          `symbol() read failed for ${contracts.supportTokenAddress}: ${error.message}`,
        );
        return null;
      });

    await this.tx.run(async () => {
      await this.brandContracts.linkBrand(address, brand.id);
      if (symbol && !(await this.tokenRepository.existsByBrandId(brand.id))) {
        await this.tokenRepository.create({
          brandId: brand.id,
          symbol,
          totalSupply: 0,
          currentPrice: '0',
        });
      }
    });
  }

  private async reconcileHoldings(
    userId: string,
    address: string,
  ): Promise<void> {
    const supportTokenAddresses =
      await this.brandContracts.listSupportTokenAddresses();

    for (const supportTokenAddress of supportTokenAddresses) {
      const contracts =
        await this.brandContracts.findBySupportTokenAddress(
          supportTokenAddress,
        );
      if (!contracts?.brandId) continue;
      const token = await this.tokenRepository.findByBrandId(contracts.brandId);
      if (!token) continue;

      const balanceRaw = await this.chainReader
        .readContract<bigint>({
          address: supportTokenAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
        })
        .catch((error: Error) => {
          this.logger.warn(
            `balanceOf() read failed for ${supportTokenAddress}: ${error.message}`,
          );
          return null;
        });
      if (balanceRaw == null) continue;

      const balance = Number(formatUnits(balanceRaw, 18));
      await this.tx.run(() =>
        this.tokenHolders.setBalance(userId, token.id, balance),
      );
    }
  }
}
