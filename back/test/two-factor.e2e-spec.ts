import request from 'supertest';
import { authenticator } from 'otplib';
import {
  bearer,
  createE2EApp,
  destroyE2EApp,
  E2EContext,
  seedUser,
  signToken,
} from './e2e-app';

describe('2FA TOTP (e2e)', () => {
  let ctx: E2EContext;
  const http = () => request(ctx.app.getHttpServer());
  const password = 'Password123!';

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await destroyE2EApp(ctx);
  });

  it('runs the full setup → enable → login-challenge → verify → disable flow against the DB', async () => {
    const user = await seedUser(ctx, {
      email: 'ada-2fa@example.com',
      username: 'ada_2fa',
      password,
    });
    const token = signToken(ctx, user);

    const setup = await http()
      .post('/api/auth/2fa/setup')
      .set(...bearer(token))
      .expect(201);
    const { secret } = (
      setup.body as { data: { secret: string; otpauthUri: string } }
    ).data;
    expect(secret).toBeTruthy();

    const enable = await http()
      .post('/api/auth/2fa/enable')
      .set(...bearer(token))
      .send({ code: authenticator.generate(secret) })
      .expect(200);
    const { recoveryCodes } = (
      enable.body as { data: { recoveryCodes: string[] } }
    ).data;
    expect(recoveryCodes).toHaveLength(10);

    // A regular login now returns a challenge instead of a session.
    const login = await http()
      .post('/api/auth/login')
      .send({ email: user.email, password })
      .expect(200);
    expect((login.body as { data: unknown }).data).toMatchObject({
      twoFactorRequired: true,
      user: null,
      token: null,
    });
    const { challengeToken } = (login.body as { data: { challengeToken: string } })
      .data;

    // Wrong code does not consume the challenge; it's rejected.
    await http()
      .post('/api/auth/2fa/verify')
      .send({ challengeToken, code: '000000' })
      .expect(401);

    // Correct live TOTP code resolves the challenge into a full session.
    const verify = await http()
      .post('/api/auth/2fa/verify')
      .send({ challengeToken, code: authenticator.generate(secret) })
      .expect(200);
    expect((verify.body as { data: unknown }).data).toMatchObject({
      twoFactorRequired: false,
    });
    const sessionToken = (verify.body as { data: { token: string } }).data
      .token;
    expect(typeof sessionToken).toBe('string');

    // A recovery code works once, and is rejected the second time.
    const login2 = await http()
      .post('/api/auth/login')
      .send({ email: user.email, password })
      .expect(200);
    const challengeToken2 = (
      login2.body as { data: { challengeToken: string } }
    ).data.challengeToken;
    await http()
      .post('/api/auth/2fa/verify')
      .send({ challengeToken: challengeToken2, code: recoveryCodes[0] })
      .expect(200);

    const login3 = await http()
      .post('/api/auth/login')
      .send({ email: user.email, password })
      .expect(200);
    const challengeToken3 = (
      login3.body as { data: { challengeToken: string } }
    ).data.challengeToken;
    await http()
      .post('/api/auth/2fa/verify')
      .send({ challengeToken: challengeToken3, code: recoveryCodes[0] })
      .expect(401);

    // Disabling requires the correct password.
    await http()
      .post('/api/auth/2fa/disable')
      .set(...bearer(sessionToken))
      .send({ password: 'wrong-password' })
      .expect(401);
    await http()
      .post('/api/auth/2fa/disable')
      .set(...bearer(sessionToken))
      .send({ password })
      .expect(200);

    // Login is back to normal, no challenge required.
    const finalLogin = await http()
      .post('/api/auth/login')
      .send({ email: user.email, password })
      .expect(200);
    expect((finalLogin.body as { data: unknown }).data).toMatchObject({
      twoFactorRequired: false,
    });
    expect(
      (finalLogin.body as { data: { token: string | null } }).data.token,
    ).toBeTruthy();
  });

  it('locks a challenge out after 5 failed attempts', async () => {
    const user = await seedUser(ctx, {
      email: 'lockout-2fa@example.com',
      username: 'lockout_2fa',
      password,
    });
    const token = signToken(ctx, user);

    const setup = await http()
      .post('/api/auth/2fa/setup')
      .set(...bearer(token))
      .expect(201);
    const { secret } = (setup.body as { data: { secret: string } }).data;
    await http()
      .post('/api/auth/2fa/enable')
      .set(...bearer(token))
      .send({ code: authenticator.generate(secret) })
      .expect(200);

    const login = await http()
      .post('/api/auth/login')
      .send({ email: user.email, password })
      .expect(200);
    const { challengeToken } = (
      login.body as { data: { challengeToken: string } }
    ).data;

    for (let i = 0; i < 4; i++) {
      const res = await http()
        .post('/api/auth/2fa/verify')
        .send({ challengeToken, code: '000000' });
      expect((res.body as { error: { name: string } }).error.name).toBe(
        'InvalidTwoFactorCodeError',
      );
    }

    const locked = await http()
      .post('/api/auth/2fa/verify')
      .send({ challengeToken, code: '000000' })
      .expect(401);
    expect((locked.body as { error: { name: string } }).error.name).toBe(
      'TooManyTwoFactorAttemptsError',
    );

    // The challenge is gone — even the correct code is now rejected.
    await http()
      .post('/api/auth/2fa/verify')
      .send({ challengeToken, code: authenticator.generate(secret) })
      .expect(401);
  });
});
