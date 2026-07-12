import { Erc20TransferHandler } from './erc20-transfer.handler';
import {
  FakeTransactionRunner,
  InMemoryBrandContractsRepository,
  InMemoryTokenSaleRepository,
} from '../test-fakes';
import { InMemoryUserRepository } from '../../../users/infrastructure/in-memory-user.repository';
import {
  InMemoryTokenHolderRepository,
  InMemoryTokenRepository,
  InMemoryTokenTransactionRepository,
} from '../../../tokens/application/test-fakes';
import { ZERO_ADDRESS } from '../../infrastructure/abis';
import type { DecodedLog } from '../../domain/chain-reader';

function log(overrides: Partial<DecodedLog> = {}): DecodedLog {
  return {
    eventName: 'Transfer',
    address: '0xsupport',
    args: { from: '0xfrom', to: '0xto', value: 10_000_000_000_000_000_000n },
    transactionHash: '0xtx',
    blockNumber: 1n,
    logIndex: 0,
    ...overrides,
  };
}

describe('Erc20TransferHandler', () => {
  const setup = () => {
    const brandContracts = new InMemoryBrandContractsRepository();
    const tokenSales = new InMemoryTokenSaleRepository();
    const users = new InMemoryUserRepository();
    const tokens = new InMemoryTokenRepository();
    const holders = new InMemoryTokenHolderRepository();
    const transactions = new InMemoryTokenTransactionRepository();
    const handler = new Erc20TransferHandler(
      brandContracts,
      tokenSales,
      users,
      tokens,
      holders,
      transactions,
      new FakeTransactionRunner(),
    );
    const contracts = brandContracts.seed({
      supportTokenAddress: '0xsupport',
      brandId: 'brand-1',
    });
    const token = tokens.seed({ brandId: contracts.brandId! });
    return {
      brandContracts,
      tokenSales,
      users,
      tokens,
      holders,
      transactions,
      handler,
      token,
    };
  };

  it('does nothing when the support token cannot be resolved to a brand_token', async () => {
    const brandContracts = new InMemoryBrandContractsRepository();
    const tokenSales = new InMemoryTokenSaleRepository();
    const users = new InMemoryUserRepository();
    const tokens = new InMemoryTokenRepository();
    const holders = new InMemoryTokenHolderRepository();
    const transactions = new InMemoryTokenTransactionRepository();
    const handler = new Erc20TransferHandler(
      brandContracts,
      tokenSales,
      users,
      tokens,
      holders,
      transactions,
      new FakeTransactionRunner(),
    );

    await handler.handle(log());

    expect(transactions.recorded).toHaveLength(0);
  });

  it('mint (from zero) increases brand_token.totalSupply and credits the recipient', async () => {
    const { users, tokens, holders, transactions, handler, token } = setup();
    const recipient = users.seed({ blockchainAddress: '0xto' });

    await handler.handle(
      log({
        args: {
          from: ZERO_ADDRESS,
          to: '0xto',
          value: 10_000_000_000_000_000_000n,
        },
      }),
    );

    expect((await tokens.findById(token.id))?.totalSupply).toBe(10);
    expect(await holders.getBalance(recipient.id, token.id)).toBe(10);
    // Mint is not a user-facing "transfer" row.
    expect(transactions.recorded).toHaveLength(0);
  });

  it('P2P transfer between two known users moves the balance and records a transfer row', async () => {
    const { users, holders, transactions, handler, token } = setup();
    const from = users.seed({ blockchainAddress: '0xfrom' });
    const to = users.seed({ blockchainAddress: '0xto' });
    await holders.setBalance(from.id, token.id, 50);

    await handler.handle(log());

    expect(await holders.getBalance(from.id, token.id)).toBe(40);
    expect(await holders.getBalance(to.id, token.id)).toBe(10);
    expect(transactions.recorded).toHaveLength(1);
    expect(transactions.recorded[0]).toMatchObject({
      tokenId: token.id,
      fromUserId: from.id,
      toUserId: to.id,
      amount: 10,
      transactionType: 'transfer',
    });
  });

  it('credits only the known side when the counterparty is unknown', async () => {
    const { users, holders, transactions, handler, token } = setup();
    const to = users.seed({ blockchainAddress: '0xto' });

    await handler.handle(log());

    expect(await holders.getBalance(to.id, token.id)).toBe(10);
    expect(transactions.recorded[0].fromUserId).toBeNull();
    expect(transactions.recorded[0].fromAddress).toBe('0xfrom');
  });

  it('does not record a transfer row when one leg is a known escrow (already tracked by Bought/RefundClaimed)', async () => {
    const { users, tokenSales, transactions, handler } = setup();
    tokenSales.seed({ escrowAddress: '0xfrom' });
    users.seed({ blockchainAddress: '0xto' });

    await handler.handle(log());

    expect(transactions.recorded).toHaveLength(0);
  });
});
