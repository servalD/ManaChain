import type { Abi } from 'viem';

/**
 * Event on-chain décodé, découplé du type `Log` de viem pour ne pas faire fuir
 * les détails du client RPC dans les handlers (couche application).
 */
export interface DecodedLog {
  eventName: string;
  address: string;
  args: Record<string, unknown>;
  transactionHash: string;
  blockNumber: bigint;
  logIndex: number;
}

export interface GetLogsParams {
  address: string | string[];
  abi: Abi;
  fromBlock: bigint;
  toBlock: bigint;
}

export interface ReadContractParams {
  address: string;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
}

/** PORT de lecture chaîne. `viem` reste le seul détail d'implémentation autorisé à fuir ici. */
export abstract class ChainReader {
  abstract getBlockNumber(): Promise<bigint>;
  abstract getLogs(params: GetLogsParams): Promise<DecodedLog[]>;
  /** Lecture ponctuelle (ex. `symbol()`/`balanceOf()` ERC-20) — hors event log. */
  abstract readContract<T>(params: ReadContractParams): Promise<T>;
}
