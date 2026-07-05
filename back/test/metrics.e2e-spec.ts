import request from 'supertest';
import { createE2EApp, destroyE2EApp, E2EContext } from './e2e-app';

describe('Metrics (e2e)', () => {
  let ctx: E2EContext;
  const http = () => request(ctx.app.getHttpServer());

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await destroyE2EApp(ctx);
  });

  it('GET /metrics is public and exposes default Node.js metrics', async () => {
    const res = await http().get('/metrics').expect(200);
    expect(res.text).toContain('nodejs_eventloop_lag');
  });

  it('GET /api/metrics does not exist (metrics is outside the /api prefix)', () => {
    return http().get('/api/metrics').expect(404);
  });
});
