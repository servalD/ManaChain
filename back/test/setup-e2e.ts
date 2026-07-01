import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../..');
const backRoot = resolve(__dirname, '..');

// Charge un éventuel .env.test (racine repo ou back/). dotenv n'écrase pas les
// variables déjà présentes (la CI fournit les siennes via l'environnement).
for (const envPath of [
  resolve(repoRoot, '.env.test'),
  resolve(backRoot, '.env.test'),
]) {
  if (existsSync(envPath)) {
    config({ path: envPath });
  }
}

/**
 * Valeurs par défaut pour les e2e locaux (base Postgres éphémère du
 * `docker/docker-compose.test.yml` : manachain_test sur le port 5433).
 */
const E2E_ENV_DEFAULTS: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: '3001',
  CORS_ORIGIN: 'http://localhost:3000',
  FRONTEND_URL: 'http://localhost:3000',
  API_URL: 'http://localhost:3001/api',
  DATABASE_HOST: 'localhost',
  DATABASE_PORT: '5433',
  DATABASE_NAME: 'manachain_test',
  DATABASE_USER: 'manachain_test',
  DATABASE_PASSWORD: 'manachain_test',
  APP_JWT_SECRET: 'test-only-secret-change-me-please-32',
  APP_JWT_EXPIRES_IN: '1h',
};

for (const [key, value] of Object.entries(E2E_ENV_DEFAULTS)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}
