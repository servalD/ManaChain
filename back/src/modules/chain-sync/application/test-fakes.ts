import { randomUUID } from 'node:crypto';
import { TransactionRunner } from '../../../shared/application/transaction-runner';
import {
  BrandContractsRepository,
  CreateBrandContractsParams,
} from '../domain/brand-contracts.repository';
import { BrandContracts } from '../domain/brand-contracts';
import {
  CreateTokenSaleParams,
  TokenSaleRepository,
} from '../domain/token-sale.repository';
import { TokenSale, TokenSaleStatus } from '../domain/token-sale';
import { SyncCursorRepository } from '../domain/sync-cursor.repository';
import {
  ChainReader,
  DecodedLog,
  GetLogsParams,
  ReadContractParams,
} from '../domain/chain-reader';

export class FakeTransactionRunner extends TransactionRunner {
  run<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}

export class InMemoryBrandContractsRepository extends BrandContractsRepository {
  private readonly rows = new Map<string, BrandContracts>();

  seed(
    partial: Partial<BrandContracts> & { id?: string } = {},
  ): BrandContracts {
    const now = new Date();
    const row = new BrandContracts(
      partial.id ?? randomUUID(),
      partial.brandId ?? null,
      partial.brandAddress ?? `0xbrand${this.rows.size}`,
      partial.genesisNftAddress ?? '0xgenesis',
      partial.vaultAddress ?? '0xvault',
      partial.supportTokenAddress ?? '0xsupport',
      partial.whitelisted ?? false,
      partial.blacklisted ?? false,
      partial.deployTxHash ?? '0xtx',
      partial.blockNumber ?? 1n,
      partial.createdAt ?? now,
      partial.updatedAt ?? now,
    );
    this.rows.set(row.id, row);
    return row;
  }

  findByBrandAddress(brandAddress: string): Promise<BrandContracts | null> {
    return Promise.resolve(
      [...this.rows.values()].find((r) => r.brandAddress === brandAddress) ??
        null,
    );
  }
  findByBrandId(brandId: string): Promise<BrandContracts | null> {
    return Promise.resolve(
      [...this.rows.values()].find((r) => r.brandId === brandId) ?? null,
    );
  }
  findBySupportTokenAddress(
    supportTokenAddress: string,
  ): Promise<BrandContracts | null> {
    return Promise.resolve(
      [...this.rows.values()].find(
        (r) => r.supportTokenAddress === supportTokenAddress,
      ) ?? null,
    );
  }
  create(params: CreateBrandContractsParams): Promise<BrandContracts> {
    return Promise.resolve(this.seed(params));
  }
  async linkBrand(brandAddress: string, brandId: string): Promise<void> {
    const row = await this.findByBrandAddress(brandAddress);
    if (row) this.seed({ ...row, brandId });
  }
  async setWhitelisted(
    brandAddress: string,
    whitelisted: boolean,
  ): Promise<void> {
    const row = await this.findByBrandAddress(brandAddress);
    if (row) this.seed({ ...row, whitelisted });
  }
  async setBlacklisted(
    brandAddress: string,
    blacklisted: boolean,
  ): Promise<void> {
    const row = await this.findByBrandAddress(brandAddress);
    if (row) this.seed({ ...row, blacklisted });
  }
  listSupportTokenAddresses(): Promise<string[]> {
    return Promise.resolve(
      [...this.rows.values()].map((r) => r.supportTokenAddress),
    );
  }
}

export class InMemoryTokenSaleRepository extends TokenSaleRepository {
  private readonly rows = new Map<string, TokenSale>();

  seed(partial: Partial<TokenSale> & { id?: string } = {}): TokenSale {
    const now = new Date();
    const row = new TokenSale(
      partial.id ?? randomUUID(),
      partial.tokenId ?? randomUUID(),
      partial.escrowAddress ?? `0xescrow${this.rows.size}`,
      partial.pricePerToken ?? '1000000',
      partial.totalForSale ?? '1000000000000000000000',
      partial.soldAmount ?? '0',
      partial.startTime ?? now,
      partial.endTime ?? now,
      partial.status ?? 'open',
      partial.deployTxHash ?? '0xtx',
      partial.createdAt ?? now,
      partial.updatedAt ?? now,
    );
    this.rows.set(row.id, row);
    return row;
  }

  findByEscrowAddress(escrowAddress: string): Promise<TokenSale | null> {
    return Promise.resolve(
      [...this.rows.values()].find((r) => r.escrowAddress === escrowAddress) ??
        null,
    );
  }
  findByTokenId(tokenId: string): Promise<TokenSale | null> {
    return Promise.resolve(
      [...this.rows.values()].find((r) => r.tokenId === tokenId) ?? null,
    );
  }
  create(params: CreateTokenSaleParams): Promise<TokenSale> {
    return Promise.resolve(this.seed(params));
  }
  async increaseSold(escrowAddress: string, amount: string): Promise<void> {
    const row = await this.findByEscrowAddress(escrowAddress);
    if (row)
      this.seed({
        ...row,
        soldAmount: (BigInt(row.soldAmount) + BigInt(amount)).toString(),
      });
  }
  async setStatus(
    escrowAddress: string,
    status: TokenSaleStatus,
  ): Promise<void> {
    const row = await this.findByEscrowAddress(escrowAddress);
    if (row) this.seed({ ...row, status });
  }
  listAllEscrowAddresses(): Promise<string[]> {
    return Promise.resolve([...this.rows.values()].map((r) => r.escrowAddress));
  }
}

export class InMemorySyncCursorRepository extends SyncCursorRepository {
  private readonly blocks = new Map<string, bigint>();
  getLastProcessedBlock(id: string): Promise<bigint> {
    return Promise.resolve(this.blocks.get(id) ?? 0n);
  }
  setLastProcessedBlock(id: string, block: bigint): Promise<void> {
    this.blocks.set(id, block);
    return Promise.resolve();
  }
}

export class FakeChainReader extends ChainReader {
  blockNumber = 0n;
  logs: DecodedLog[] = [];
  contractReads = new Map<string, unknown>();

  getBlockNumber(): Promise<bigint> {
    return Promise.resolve(this.blockNumber);
  }
  getLogs(params: GetLogsParams): Promise<DecodedLog[]> {
    const addresses = Array.isArray(params.address)
      ? params.address
      : [params.address];
    return Promise.resolve(
      this.logs.filter(
        (l) =>
          addresses.includes(l.address) &&
          l.blockNumber >= params.fromBlock &&
          l.blockNumber <= params.toBlock,
      ),
    );
  }
  readContract<T>(params: ReadContractParams): Promise<T> {
    const key = `${params.address}:${params.functionName}`;
    return Promise.resolve(this.contractReads.get(key) as T);
  }
}
