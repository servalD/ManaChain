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
import { BrandLookup } from '../domain/brand-lookup';
import { BlockchainGateway } from '../domain/blockchain-gateway';
import { TransactionRunner } from '../../../shared/application/transaction-runner';

/** Exécute le bloc sans vraie transaction (les fakes in-memory suffisent). */
export class FakeTransactionRunner extends TransactionRunner {
  run<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}

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
  listByToken(): Promise<{ holders: TokenHolder[]; total: number }> {
    return Promise.resolve({ holders: [], total: 0 });
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
}

export class FakeBrandLookup extends BrandLookup {
  private readonly byOwner = new Map<string, string>();
  private readonly owners = new Map<string, string>();
  seedBrand(brandId: string, ownerId: string): void {
    this.byOwner.set(ownerId, brandId);
    this.owners.set(brandId, ownerId);
  }
  findBrandIdByOwner(userId: string): Promise<string | null> {
    return Promise.resolve(this.byOwner.get(userId) ?? null);
  }
  findOwnerId(brandId: string): Promise<string | null> {
    return Promise.resolve(this.owners.get(brandId) ?? null);
  }
}

export class FakeBlockchainGateway extends BlockchainGateway {
  readonly purchases: unknown[] = [];
  readonly transfers: unknown[] = [];
  onTokensPurchased(
    tokenId: string,
    userId: string,
    amount: number,
  ): Promise<void> {
    this.purchases.push({ tokenId, userId, amount });
    return Promise.resolve();
  }
  onTokensTransferred(
    tokenId: string,
    fromUserId: string,
    toUserId: string,
    amount: number,
  ): Promise<void> {
    this.transfers.push({ tokenId, fromUserId, toUserId, amount });
    return Promise.resolve();
  }
}
