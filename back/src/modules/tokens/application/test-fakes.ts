import { randomUUID } from 'node:crypto';
import { Token } from '../domain/token';
import { TokenHolder } from '../domain/token-holder';
import { TokenTransaction } from '../domain/token-transaction';
import { CreateTokenParams, TokenRepository } from '../domain/token.repository';
import {
  PortfolioEntry,
  TokenHolderRepository,
} from '../domain/token-holder.repository';
import {
  RecordTransactionParams,
  TokenTransactionRepository,
} from '../domain/token-transaction.repository';

export { FakeTransactionRunner } from '../../../shared/application/test-fakes';

export class InMemoryTokenRepository extends TokenRepository {
  private readonly tokens = new Map<string, Token>();

  seed(partial: Partial<Token> & { id?: string } = {}): Token {
    const now = new Date();
    const token = new Token(
      partial.id ?? randomUUID(),
      partial.brandId ?? randomUUID(),
      partial.symbol ?? 'SYM',
      partial.totalSupply ?? 0,
      partial.currentPrice ?? '0',
      partial.nftTokenId ?? null,
      partial.nftName ?? null,
      partial.nftSymbol ?? null,
      partial.createdAt ?? now,
      partial.updatedAt ?? now,
    );
    this.tokens.set(token.id, token);
    return token;
  }

  findById(id: string): Promise<Token | null> {
    return Promise.resolve(this.tokens.get(id) ?? null);
  }
  findByBrandId(brandId: string): Promise<Token | null> {
    return Promise.resolve(
      [...this.tokens.values()].find((t) => t.brandId === brandId) ?? null,
    );
  }
  existsByBrandId(brandId: string): Promise<boolean> {
    return Promise.resolve(
      [...this.tokens.values()].some((t) => t.brandId === brandId),
    );
  }
  isSymbolTaken(symbol: string): Promise<boolean> {
    return Promise.resolve(
      [...this.tokens.values()].some((t) => t.symbol === symbol),
    );
  }
  create(params: CreateTokenParams): Promise<Token> {
    return Promise.resolve(
      this.seed({
        brandId: params.brandId,
        symbol: params.symbol,
        totalSupply: params.totalSupply,
        currentPrice: params.currentPrice,
      }),
    );
  }
  updatePrice(tokenId: string, price: string): Promise<Token> {
    const t = this.tokens.get(tokenId)!;
    const updated = new Token(
      t.id,
      t.brandId,
      t.symbol,
      t.totalSupply,
      price,
      t.nftTokenId,
      t.nftName,
      t.nftSymbol,
      t.createdAt,
      new Date(),
    );
    this.tokens.set(tokenId, updated);
    return Promise.resolve(updated);
  }
  increaseSupply(tokenId: string, amount: number): Promise<void> {
    const t = this.tokens.get(tokenId);
    if (t) this.seed({ ...t, totalSupply: t.totalSupply + amount });
    return Promise.resolve();
  }
}

export class InMemoryTokenHolderRepository extends TokenHolderRepository {
  private readonly balances = new Map<string, number>();
  private key(u: string, t: string): string {
    return `${u}:${t}`;
  }
  getBalance(userId: string, tokenId: string): Promise<number> {
    return Promise.resolve(this.balances.get(this.key(userId, tokenId)) ?? 0);
  }
  getBalanceForUpdate(userId: string, tokenId: string): Promise<number> {
    return this.getBalance(userId, tokenId);
  }
  setBalance(userId: string, tokenId: string, balance: number): Promise<void> {
    this.balances.set(this.key(userId, tokenId), balance);
    return Promise.resolve();
  }
  listByToken(
    tokenId: string,
    limit: number,
    offset: number,
  ): Promise<{ holders: TokenHolder[]; total: number }> {
    const now = new Date();
    const all = [...this.balances.entries()]
      .filter(([key, balance]) => key.endsWith(`:${tokenId}`) && balance > 0)
      .map(([key, balance]) => {
        const [userId] = key.split(':');
        return new TokenHolder(key, userId, tokenId, balance, now, now);
      })
      .sort((a, b) => b.balance - a.balance);
    return Promise.resolve({
      holders: all.slice(offset, offset + limit),
      total: all.length,
    });
  }
  listPortfolio(): Promise<PortfolioEntry[]> {
    return Promise.resolve([]);
  }
}

export class InMemoryTokenTransactionRepository extends TokenTransactionRepository {
  readonly recorded: RecordTransactionParams[] = [];
  record(params: RecordTransactionParams): Promise<void> {
    this.recorded.push(params);
    return Promise.resolve();
  }
  listByToken(): Promise<{ transactions: TokenTransaction[]; total: number }> {
    return Promise.resolve({ transactions: [], total: 0 });
  }
  listByUser(): Promise<{ transactions: TokenTransaction[]; total: number }> {
    return Promise.resolve({ transactions: [], total: 0 });
  }
  readonly unlinked: string[] = [];
  unlinkUser(userId: string): Promise<void> {
    this.unlinked.push(userId);
    for (const [i, params] of this.recorded.entries()) {
      this.recorded[i] = {
        ...params,
        fromUserId: params.fromUserId === userId ? null : params.fromUserId,
        toUserId: params.toUserId === userId ? null : params.toUserId,
      };
    }
    return Promise.resolve();
  }
}
