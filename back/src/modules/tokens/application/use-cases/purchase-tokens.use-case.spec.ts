import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import { AccountNotVerifiedError } from '../../domain/token.errors';
import {
  FakeBlockchainGateway,
  InMemoryTokenHolderRepository,
  InMemoryTokenRepository,
  InMemoryTokenTransactionRepository,
} from '../test-fakes';
import { PurchaseTokensUseCase } from './purchase-tokens.use-case';

describe('PurchaseTokensUseCase', () => {
  let tokens: InMemoryTokenRepository;
  let holders: InMemoryTokenHolderRepository;
  let txs: InMemoryTokenTransactionRepository;
  let chain: FakeBlockchainGateway;
  let users: InMemoryUserRepository;
  let useCase: PurchaseTokensUseCase;
  let tokenId: string;

  beforeEach(() => {
    tokens = new InMemoryTokenRepository();
    holders = new InMemoryTokenHolderRepository();
    txs = new InMemoryTokenTransactionRepository();
    chain = new FakeBlockchainGateway();
    users = new InMemoryUserRepository();
    useCase = new PurchaseTokensUseCase(tokens, holders, txs, chain);
    tokenId = tokens.seed().id;
  });

  it('credits the buyer balance and records a purchase tx', async () => {
    const buyer = users.seed({ id: 'buyer', verified: true });

    await useCase.execute(buyer, tokenId, 50, '1.0');

    await expect(holders.getBalance('buyer', tokenId)).resolves.toBe(50);
    expect(txs.recorded[0].transactionType).toBe('purchase');
    expect(txs.recorded[0].fromUserId).toBeNull();
    expect(chain.purchases).toHaveLength(1);
  });

  it('rejects an unverified account', async () => {
    const buyer = users.seed({ id: 'buyer', verified: false });
    await expect(
      useCase.execute(buyer, tokenId, 50, '1.0'),
    ).rejects.toBeInstanceOf(AccountNotVerifiedError);
  });
});
