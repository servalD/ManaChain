import request from 'supertest';
import {
  bearer,
  createE2EApp,
  destroyE2EApp,
  E2EContext,
  seedUser,
} from './e2e-app';

describe('Refresh tokens & change-password (e2e)', () => {
  let ctx: E2EContext;
  const http = () => request(ctx.app.getHttpServer());
  const password = 'Password123!';

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await destroyE2EApp(ctx);
  });

  it('runs the full login -> refresh (rotation) -> change-password -> revocation flow', async () => {
    await seedUser(ctx, {
      email: 'ada-session@example.com',
      username: 'ada_session',
      password,
    });

    const login = await http()
      .post('/api/auth/login')
      .send({ email: 'ada-session@example.com', password })
      .expect(200);
    const { token, refreshToken } = (
      login.body as { data: { token: string; refreshToken: string } }
    ).data;
    expect(token).toBeTruthy();
    expect(refreshToken).toBeTruthy();

    // Rotation: refreshing consumes the old token and issues a new pair.
    const refreshed = await http()
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);
    const newRefreshToken = (
      refreshed.body as { data: { refreshToken: string } }
    ).data.refreshToken;
    expect(newRefreshToken).not.toBe(refreshToken);

    // The old (already-rotated) refresh token is now dead — and its reuse
    // revokes the whole session (theft detection), including the new one.
    await http().post('/api/auth/refresh').send({ refreshToken }).expect(401);
    await http()
      .post('/api/auth/refresh')
      .send({ refreshToken: newRefreshToken })
      .expect(401);

    // change-password requires the current password.
    const secondLogin = await http()
      .post('/api/auth/login')
      .send({ email: 'ada-session@example.com', password })
      .expect(200);
    const session = (
      secondLogin.body as { data: { token: string; refreshToken: string } }
    ).data;

    await http()
      .post('/api/auth/change-password')
      .set(...bearer(session.token))
      .send({ currentPassword: 'wrong', newPassword: 'N3wPassword123!' })
      .expect(401);

    await http()
      .post('/api/auth/change-password')
      .set(...bearer(session.token))
      .send({ currentPassword: password, newPassword: 'N3wPassword123!' })
      .expect(200);

    // Sessions opened before the password change are revoked.
    await http()
      .post('/api/auth/refresh')
      .send({ refreshToken: session.refreshToken })
      .expect(401);

    // The new password works for a fresh login.
    await http()
      .post('/api/auth/login')
      .send({ email: 'ada-session@example.com', password: 'N3wPassword123!' })
      .expect(200);
  });

  it('logout revokes the refresh token', async () => {
    await seedUser(ctx, {
      email: 'ada-logout@example.com',
      username: 'ada_logout',
      password,
    });

    const login = await http()
      .post('/api/auth/login')
      .send({ email: 'ada-logout@example.com', password })
      .expect(200);
    const { refreshToken } = (login.body as { data: { refreshToken: string } })
      .data;

    await http().post('/api/auth/logout').send({ refreshToken }).expect(200);
    await http().post('/api/auth/refresh').send({ refreshToken }).expect(401);

    // Idempotent: logging out twice with the same token is not an error.
    await http().post('/api/auth/logout').send({ refreshToken }).expect(200);
  });
});
