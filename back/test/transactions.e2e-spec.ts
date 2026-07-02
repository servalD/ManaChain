import { createE2EApp, destroyE2EApp, E2EContext, seedUser } from './e2e-app';
import { Role } from '../src/shared/enums/role.enum';
import { TransactionRunner } from '../src/shared/application/transaction-runner';
import { UserRepository } from '../src/modules/users/domain/user.repository';
import { BrandRepository } from '../src/modules/brands/domain/brand.repository';
import { TokenRepository } from '../src/modules/tokens/domain/token.repository';
import { TokenHolderRepository } from '../src/modules/tokens/domain/token-holder.repository';
import { TransferTokensUseCase } from '../src/modules/tokens/application/use-cases/transfer-tokens.use-case';
import { InsufficientBalanceError } from '../src/modules/tokens/domain/token.errors';

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
    const r1 = await seedUser(ctx, { email: 'r1@test.dev', username: 'rcv1' });
    const r2 = await seedUser(ctx, { email: 'r2@test.dev', username: 'rcv2' });

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
    await holders.setBalance(sender.id, token.id, 50);

    // Deux débits de 30 en parallèle : un seul peut passer (solde 50).
    const transfer = ctx.app.get(TransferTokensUseCase);
    const results = await Promise.allSettled([
      transfer.execute(sender, token.id, r1.id, 30),
      transfer.execute(sender, token.id, r2.id, 30),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(InsufficientBalanceError);

    // Aucune valeur perdue : émetteur 50 → 20, un seul destinataire crédité de 30.
    expect(await holders.getBalance(sender.id, token.id)).toBe(20);
    const received =
      (await holders.getBalance(r1.id, token.id)) +
      (await holders.getBalance(r2.id, token.id));
    expect(received).toBe(30);
  });
});
