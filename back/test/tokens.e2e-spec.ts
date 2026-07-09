import request from 'supertest';
import {
  bearer,
  createE2EApp,
  destroyE2EApp,
  E2EContext,
  seedUser,
  signToken,
} from './e2e-app';
import { Role } from '../src/shared/enums/role.enum';
import { BrandRepository } from '../src/modules/brands/domain/brand.repository';
import { TokenRepository } from '../src/modules/tokens/domain/token.repository';
import { TokenHolderRepository } from '../src/modules/tokens/domain/token-holder.repository';
import { TokenTransactionRepository } from '../src/modules/tokens/domain/token-transaction.repository';
import { User } from '../src/modules/users/domain/user';

const brandFields = {
  country: 'FR',
  headquartersStreet: '1 rue de la Paix',
  headquartersCity: 'Paris',
  headquartersZipCode: '75001',
  interestIds: [] as string[],
};

/**
 * Chemin métier complet contre la vraie DB : lectures (holders, transactions,
 * stats marque) sur des données d'achat/transfert seedées directement via les
 * repositories — depuis la bascule chain-sync, ces écritures sont pilotées par
 * les events on-chain, plus par une route HTTP. Couvre le SQL brut (colonne
 * `price_per_token`, `TypeOrmBrandTokenStatsReader`, `TypeOrmBrandBanReader`),
 * non testé en unitaire.
 */
describe('Tokens & brand stats (e2e)', () => {
  let ctx: E2EContext;
  const http = () => request(ctx.app.getHttpServer());

  let brandId: string;
  let tokenId: string;
  let buyer1: User;
  let buyer2: User;
  let admin: User;

  beforeAll(async () => {
    ctx = await createE2EApp();

    const brandUser = await seedUser(ctx, {
      email: 'brand@test.dev',
      username: 'branduser',
      role: Role.BRANDUSER,
      isBrand: true,
    });
    admin = await seedUser(ctx, {
      email: 'admin@test.dev',
      username: 'admin1',
      role: Role.ADMIN,
    });
    buyer1 = await seedUser(ctx, { email: 'b1@test.dev', username: 'buyer1' });
    buyer2 = await seedUser(ctx, { email: 'b2@test.dev', username: 'buyer2' });

    const brand = await ctx.app.get(BrandRepository).create({
      ownerId: brandUser.id,
      name: 'Acme',
      ...brandFields,
    });
    brandId = brand.id;

    const token = await ctx.app.get(TokenRepository).create({
      brandId,
      symbol: 'MANA',
      totalSupply: 0,
      currentPrice: '2.00',
    });
    tokenId = token.id;
  });

  afterAll(async () => {
    await destroyE2EApp(ctx);
  });

  it('seeds purchases and a transfer as chain-sync would (direct repository writes)', async () => {
    const holders = ctx.app.get(TokenHolderRepository);
    const transactions = ctx.app.get(TokenTransactionRepository);

    await transactions.record({
      tokenId,
      fromUserId: null,
      toUserId: buyer1.id,
      amount: 100,
      transactionType: 'purchase',
      pricePerToken: 1.5,
    });
    await transactions.record({
      tokenId,
      fromUserId: null,
      toUserId: buyer2.id,
      amount: 50,
      transactionType: 'purchase',
      pricePerToken: 2.0,
    });
    await holders.setBalance(buyer1.id, tokenId, 100);
    await holders.setBalance(buyer2.id, tokenId, 50);

    const balance = await http()
      .get(`/api/tokens/${tokenId}/balance`)
      .set(...bearer(signToken(ctx, buyer1)))
      .expect(200);
    expect((balance.body as { balance: number }).balance).toBe(100);

    // Transfert P2P (équivalent d'un Transfer ERC-20 buyer1 -> buyer2).
    await transactions.record({
      tokenId,
      fromUserId: buyer1.id,
      toUserId: buyer2.id,
      amount: 30,
      transactionType: 'transfer',
    });
    await holders.setBalance(buyer1.id, tokenId, 70);
    await holders.setBalance(buyer2.id, tokenId, 80);

    const b1 = await http()
      .get(`/api/tokens/${tokenId}/balance`)
      .set(...bearer(signToken(ctx, buyer1)))
      .expect(200);
    const b2 = await http()
      .get(`/api/tokens/${tokenId}/balance`)
      .set(...bearer(signToken(ctx, buyer2)))
      .expect(200);
    expect((b1.body as { balance: number }).balance).toBe(70);
    expect((b2.body as { balance: number }).balance).toBe(80);
  });

  it('lists holders and transactions from the DB', async () => {
    const holders = await http()
      .get(`/api/tokens/${tokenId}/holders`)
      .expect(200);
    expect((holders.body as { total: number }).total).toBe(2);

    const txs = await http()
      .get(`/api/tokens/${tokenId}/transactions`)
      .expect(200);
    const body = txs.body as {
      total: number;
      transactions: { amount: number; pricePerToken: number | null }[];
    };
    expect(body.total).toBe(3);
    const purchase100 = body.transactions.find((t) => t.amount === 100);
    expect(purchase100?.pricePerToken).toBe(1.5);
  });

  it('computes real brand stats (Σ amount × price)', async () => {
    const res = await http().get(`/api/brands/${brandId}/stats`).expect(200);
    const stats = res.body as {
      tokenHolders: number;
      totalRaised: string;
      tokenSymbol: string | null;
      tokenPrice: string | null;
    };
    expect(stats.tokenHolders).toBe(2);
    expect(stats.totalRaised).toBe('250.00'); // 100×1.5 + 50×2.0
    expect(stats.tokenSymbol).toBe('MANA');
    expect(Number(stats.tokenPrice)).toBe(2);
  });

  it('excludes actively banned brands from the admin active list', async () => {
    const otherOwner = await seedUser(ctx, {
      email: 'brand2@test.dev',
      username: 'branduser2',
      role: Role.BRANDUSER,
      isBrand: true,
    });
    const banned = await ctx.app.get(BrandRepository).create({
      ownerId: otherOwner.id,
      name: 'Banned Co',
      ...brandFields,
    });
    await ctx.dataSource.query(
      `INSERT INTO brand_ban (brand_id, reason, banned_by, is_permanent)
       VALUES ($1, 'spam', $2, TRUE)`,
      [banned.id, admin.id],
    );

    const res = await http()
      .get('/api/brands/admin/active')
      .set(...bearer(signToken(ctx, admin)))
      .expect(200);
    const ids = (res.body as { brands: { id: string }[] }).brands.map(
      (b) => b.id,
    );
    expect(ids).toContain(brandId);
    expect(ids).not.toContain(banned.id);
  });
});
