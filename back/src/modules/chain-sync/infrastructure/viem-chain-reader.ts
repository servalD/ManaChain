import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPublicClient, http, PublicClient } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { Env } from '../../../infrastructure/config/env.validation';
import {
  ChainReader,
  DecodedLog,
  GetLogsParams,
  ReadContractParams,
} from '../domain/chain-reader';

/**
 * Adapter {@link ChainReader} sur `viem`. Toujours Avalanche Fuji (43113) — le
 * `chainId` d'env sert de garde-fou (voir constructeur), pas de sélection.
 */
@Injectable()
export class ViemChainReader extends ChainReader {
  private readonly client: PublicClient;

  constructor(config: ConfigService<Env, true>) {
    super();
    const rpcUrl = config.get('CHAIN_RPC_URL', { infer: true });
    this.client = createPublicClient({
      chain: avalancheFuji,
      transport: http(rpcUrl || undefined),
    });
  }

  async getBlockNumber(): Promise<bigint> {
    return this.client.getBlockNumber();
  }

  async getLogs(params: GetLogsParams): Promise<DecodedLog[]> {
    const logs = await this.client.getLogs({
      address: params.address as `0x${string}` | `0x${string}`[],
      events: params.abi.filter((item) => item.type === 'event'),
      fromBlock: params.fromBlock,
      toBlock: params.toBlock,
    });
    return logs.map((log) => ({
      eventName: (log as { eventName?: string }).eventName ?? 'unknown',
      address: log.address,
      args: (log as { args?: Record<string, unknown> }).args ?? {},
      transactionHash: log.transactionHash ?? '',
      blockNumber: log.blockNumber ?? 0n,
      logIndex: log.logIndex ?? 0,
    }));
  }

  async readContract<T>(params: ReadContractParams): Promise<T> {
    return this.client.readContract({
      address: params.address as `0x${string}`,
      abi: params.abi,
      functionName: params.functionName,
      args: params.args,
    }) as Promise<T>;
  }
}
