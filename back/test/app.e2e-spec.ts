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

describe('Auth & RBAC (e2e)', () => {
  let ctx: E2EContext;
  const http = () => request(ctx.app.getHttpServer());

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await destroyE2EApp(ctx);
  });

  it('GET /health is public', async () => {
    const res = await http().get('/health').expect(200);
    expect((res.body as { data: { status: string } }).data.status).toBe('ok');
  });

  it('GET /api/users/me without a token is 401', () => {
    return http().get('/api/users/me').expect(401);
  });

  it('rejects unknown properties (whitelist strict)', () => {
    return http()
      .post('/api/auth/register')
      .send({ email: 'x@test.dev', hacker: true })
      .expect(400);
  });

  it('runs the full register → verify → login → me flow against the DB', async () => {
    const email = 'ada@example.com';
    const password = 'Password123!';

    const register = await http()
      .post('/api/auth/register')
      .send({
        email,
        username: 'ada_l',
        firstName: 'Ada',
        lastName: 'Lovelace',
        password,
        ageRange: '25-34',
      })
      .expect(201);
    expect(
      (register.body as { data: { token: string | null } }).data.token,
    ).toBeNull();

    // Login avant vérification → refusé.
    await http().post('/api/auth/login').send({ email, password }).expect(403);

    // Récupère le token de vérification capturé par le Mailer de test (le
    // token en base est désormais hashé, cf. M-1 — seul l'email contient le
    // token en clair).
    const verification = ctx.mailer.verifications.find((v) => v.to === email);
    await http()
      .post('/api/auth/verify-email')
      .send({ token: verification?.token })
      .expect(200);

    const login = await http()
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    const token = (login.body as { data: { token: string } }).data.token;
    expect(typeof token).toBe('string');

    const me = await http()
      .get('/api/users/me')
      .set(...bearer(token))
      .expect(200);
    expect(
      (me.body as { data: { email: string; role: Role } }).data,
    ).toMatchObject({
      email,
      role: Role.CLIENT,
    });
  });

  it('enforces admin-only routes (403 for CLIENT, 200 for ADMIN)', async () => {
    const client = await seedUser(ctx, {
      email: 'client@test.dev',
      username: 'client1',
    });
    const admin = await seedUser(ctx, {
      email: 'admin@test.dev',
      username: 'admin1',
      role: Role.ADMIN,
    });

    await http()
      .get('/api/users')
      .set(...bearer(signToken(ctx, client)))
      .expect(403);

    const res = await http()
      .get('/api/users')
      .set(...bearer(signToken(ctx, admin)))
      .expect(200);
    // GET /api/users renvoie une liste paginée { users, total }.
    const body = (res.body as { data: { users: unknown[]; total: number } })
      .data;
    expect(Array.isArray(body.users)).toBe(true);
    expect(body.users.length).toBeGreaterThanOrEqual(2);
    expect(body.total).toBeGreaterThanOrEqual(2);
  });
});
