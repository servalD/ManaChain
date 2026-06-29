import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import {
  AccountNotVerifiedError,
  InsufficientBalanceError,
  SelfTransferError,
} from '../../domain/token.errors';
import {
  FakeBlockchainGateway,
  InMemoryTokenHolderRepository,
  InMemoryTokenRepository,
  InMemoryTokenTransactionRepository,
} from '../test-fakes';
import { TransferTokensUseCase } from './transfer-tokens.use-case';

describe('TransferTokensUseCase', () => {
  let tokens: InMemoryTokenRepository;
  let holders: InMemoryTokenHolderRepository;
  let txs: InMemoryTokenTransactionRepository;
  let chain: FakeBlockchainGateway;
  let users: InMemoryUserRepository;
  let useCase: TransferTokensUseCase;
  let tokenId: string;

  beforeEach(() => {
    tokens = new InMemoryTokenRepository();
    holders = new InMemoryTokenHolderRepository();
    txs = new InMemoryTokenTransactionRepository();
    chain = new FakeBlockchainGateway();
    users = new InMemoryUserRepository();
    useCase = new TransferTokensUseCase(tokens, holders, txs, chain);
    tokenId = tokens.seed().id;
  });

  it('moves balance, records the tx and calls the chain hook', async () => {
    const sender = users.seed({ id: 'sender', verified: true });
    await holders.setBalance('sender', tokenId, 100);

    await useCase.execute(sender, tokenId, 'receiver', 30);

    await expect(holders.getBalance('sender', tokenId)).resolves.toBe(70);
    await expect(holders.getBalance('receiver', tokenId)).resolves.toBe(30);
    expect(txs.recorded).toHaveLength(1);
    expect(chain.transfers).toHaveLength(1);
  });

  it('rejects an unverified account', async () => {
    const sender = users.seed({ id: 'sender', verified: false });
    await holders.setBalance('sender', tokenId, 100);
    await expect(
      useCase.execute(sender, tokenId, 'receiver', 10),
    ).rejects.toBeInstanceOf(AccountNotVerifiedError);
  });

  it('rejects a self transfer', async () => {
    const sender = users.seed({ id: 'sender', verified: true });
    await expect(
      useCase.execute(sender, tokenId, 'sender', 10),
    ).rejects.toBeInstanceOf(SelfTransferError);
  });

  it('rejects an insufficient balance', async () => {
    const sender = users.seed({ id: 'sender', verified: true });
    await holders.setBalance('sender', tokenId, 5);
    await expect(
      useCase.execute(sender, tokenId, 'receiver', 10),
    ).rejects.toBeInstanceOf(InsufficientBalanceError);
  });
});
