import request from 'supertest';
import {
  bearer,
  createE2EApp,
  destroyE2EApp,
  E2EContext,
  seedUser,
  signToken,
} from './e2e-app';

describe('Media routes (e2e)', () => {
  let ctx: E2EContext;
  const http = () => request(ctx.app.getHttpServer());

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await destroyE2EApp(ctx);
  });

  it('rejects an unauthenticated upload', async () => {
    await http()
      .post('/api/media/upload')
      .attach('file', Buffer.from('fake'), 'logo.png')
      .expect(401);
  });

  it('rejects an unauthenticated delete', async () => {
    await http().delete('/api/media/someCid1').expect(401);
  });

  it('allows an authenticated CLIENT to reach the upload use-case (fails on missing Pinata config, not auth)', async () => {
    const user = await seedUser(ctx, {
      email: 'media-user@example.com',
      username: 'media_user',
    });
    const token = signToken(ctx, user);

    // No PINATA_JWT configured in the test env: the request is authenticated
    // and reaches the use-case, but storage is unavailable (400), never 401/403.
    const response = await http()
      .post('/api/media/upload')
      .set(...bearer(token))
      .attach('file', Buffer.from('fake'), 'logo.png');

    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  });
});
