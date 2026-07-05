import { NextResponse } from 'next/server';

// Healthcheck Docker (client/Dockerfile) : jamais mis en cache, jamais routé
// publiquement en prod (deploy/stack.yml.j2 exclut /health du router traefik).
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ status: 'ok' });
}
