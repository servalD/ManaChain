import { randomUUID } from 'node:crypto';
import { UnlinkUserChainDataUseCase } from './unlink-user-chain-data.use-case';
import { InMemoryUserRepository } from '../../users/infrastructure/in-memory-user.repository';
import {
  FakeTransactionRunner,
  InMemoryTokenTransactionRepository,
} from '../../tokens/application/test-fakes';

describe('UnlinkUserChainDataUseCase', () => {
  it('clears the blockchain address and unlinks token_transaction rows', async () => {
    const users = new InMemoryUserRepository();
    const transactions = new InMemoryTokenTransactionRepository();
    const useCase = new UnlinkUserChainDataUseCase(
      users,
      transactions,
      new FakeTransactionRunner(),
    );

    const user = users.seed({ blockchainAddress: '0xabc' });
    const tokenId = randomUUID();
    await transactions.record({
      tokenId,
      fromUserId: null,
      toUserId: user.id,
      amount: 10,
      transactionType: 'purchase',
    });
    await transactions.record({
      tokenId,
      fromUserId: user.id,
      toUserId: randomUUID(),
      amount: 5,
      transactionType: 'transfer',
    });

    await useCase.execute(user.id);

    const updated = await users.findById(user.id);
    expect(updated?.blockchainAddress).toBeNull();
    expect(transactions.recorded.every((t) => t.fromUserId !== user.id)).toBe(
      true,
    );
    expect(transactions.recorded.every((t) => t.toUserId !== user.id)).toBe(
      true,
    );
  });

  it('leaves other users untouched', async () => {
    const users = new InMemoryUserRepository();
    const transactions = new InMemoryTokenTransactionRepository();
    const useCase = new UnlinkUserChainDataUseCase(
      users,
      transactions,
      new FakeTransactionRunner(),
    );

    const target = users.seed({ blockchainAddress: '0xabc' });
    const other = users.seed({ blockchainAddress: '0xdef' });
    await transactions.record({
      tokenId: randomUUID(),
      fromUserId: null,
      toUserId: other.id,
      amount: 1,
      transactionType: 'purchase',
    });

    await useCase.execute(target.id);

    expect((await users.findById(other.id))?.blockchainAddress).toBe('0xdef');
    expect(transactions.recorded[0].toUserId).toBe(other.id);
  });
});
