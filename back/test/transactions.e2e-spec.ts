import { createE2EApp, destroyE2EApp, E2EContext, seedUser } from './e2e-app';
import { Role } from '../src/shared/enums/role.enum';
import { TransactionRunner } from '../src/shared/application/transaction-runner';
import { UserRepository } from '../src/modules/users/domain/user.repository';
import { BrandRepository } from '../src/modules/brands/domain/brand.repository';
import { TokenRepository } from '../src/modules/tokens/domain/token.repository';
import { TokenHolderRepository } from '../src/modules/tokens/domain/token-holder.repository';

const brandFields = {
  country: 'FR',
  headquartersStreet: '1 rue de la Paix',
  headquartersCity: 'Paris',
  headquartersZipCode: '75001',
  interestIds: [] as string[],
};

/**
 * Vérifie l'atomicité réelle contre Postgres : rollback d'une écriture partielle
 * et sérialisation des débits concurrents via le verrou pessimiste.
 */
describe('Atomic transactions (e2e)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await destroyE2EApp(ctx);
  });

  it('rolls back a write when the transactional block throws', async () => {
    const runner = ctx.app.get(TransactionRunner);
    const users = ctx.app.get(UserRepository);

    await expect(
      runner.run(async () => {
        await users.createBrandUser({
          email: 'rollback@test.dev',
          username: 'rollbackuser',
          firstName: 'Roll',
          lastName: 'Back',
          passwordHash: 'x',
        });
        throw new Error('boom'); // force le rollback après l'insert
      }),
    ).rejects.toThrow('boom');

    const rows = await ctx.dataSource.query<{ c: number }[]>(
      `SELECT COUNT(*)::int AS c FROM "user" WHERE email = $1`,
      ['rollback@test.dev'],
    );
    expect(rows[0].c).toBe(0); // l'insert a bien été annulé
  });

  it('serializes concurrent debits — no lost update', async () => {
    // Le verrou pessimiste (getBalanceForUpdate) est le mécanisme partagé par
    // tout écrivain de token_holder — aujourd'hui chain-sync (Erc20TransferHandler),
    // avant la bascule les use-cases purchase/transfer off-chain. On exerce
    // directement la primitive plutôt qu'un use-case précis.
    const brandUser = await seedUser(ctx, {
      email: 'lockbrand@test.dev',
      username: 'lockbrand',
      role: Role.BRANDUSER,
      isBrand: true,
    });
    const sender = await seedUser(ctx, {
      email: 'sender@test.dev',
      username: 'sender',
    });

    const brand = await ctx.app
      .get(BrandRepository)
      .create({ ownerId: brandUser.id, name: 'LockCo', ...brandFields });
    const token = await ctx.app.get(TokenRepository).create({
      brandId: brand.id,
      symbol: 'LOCK',
      totalSupply: 0,
      currentPrice: '1.00',
    });

    const holders = ctx.app.get(TokenHolderRepository);
    const runner = ctx.app.get(TransactionRunner);
    await holders.setBalance(sender.id, token.id, 50);

    const debit = (amount: number) =>
      runner.run(async () => {
        const balance = await holders.getBalanceForUpdate(sender.id, token.id);
        if (balance < amount) throw new Error('insufficient balance');
        await holders.setBalance(sender.id, token.id, balance - amount);
      });

    // Deux débits de 30 en parallèle : un seul peut passer (solde 50).
    const results = await Promise.allSettled([debit(30), debit(30)]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    // Aucune valeur perdue : un seul débit de 30 a pu passer (50 -> 20).
    expect(await holders.getBalance(sender.id, token.id)).toBe(20);
  });
});
