import { DeleteAccountUseCase } from './delete-account.use-case';
import { InMemoryUserRepository } from '../../infrastructure/in-memory-user.repository';
import { FakeTransactionRunner } from '../test-fakes';
import { InMemoryTokenTransactionRepository } from '../../../tokens/application/test-fakes';
import {
  BrandOwnerCannotDeleteAccountError,
  UserNotFoundError,
} from '../../domain/user.errors';

describe('DeleteAccountUseCase', () => {
  function setup() {
    const users = new InMemoryUserRepository();
    const tokenTransactions = new InMemoryTokenTransactionRepository();
    const tx = new FakeTransactionRunner();
    const useCase = new DeleteAccountUseCase(users, tokenTransactions, tx);
    return { users, tokenTransactions, useCase };
  }

  it('anonymizes an existing account and unlinks its chain data', async () => {
    const { users, tokenTransactions, useCase } = setup();
    const user = users.seed({
      email: 'alice@example.com',
      username: 'alice',
      blockchainAddress: '0xabc',
    });
    await users.setInterestIds(user.id, ['music']);

    await useCase.execute(user.id);

    const found = await users.findById(user.id);
    expect(found).toBeNull();
    expect(tokenTransactions.unlinked).toEqual([user.id]);
    expect(await users.getInterestIds(user.id)).toEqual([]);
  });

  it('rejects deleting a non-existing account', async () => {
    const { useCase } = setup();
    await expect(useCase.execute('missing-id')).rejects.toThrow(
      UserNotFoundError,
    );
  });

  it('rejects deleting an account that owns a brand', async () => {
    const { users, useCase } = setup();
    const owner = users.seed({ isBrand: true });

    await expect(useCase.execute(owner.id)).rejects.toThrow(
      BrandOwnerCannotDeleteAccountError,
    );
  });
});
