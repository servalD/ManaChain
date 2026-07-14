import { z } from 'zod';

/**
 * Source unique de la configuration d'environnement. Validée au démarrage
 * (fail-fast) : une variable manquante ou malformée fait planter l'app
 * immédiatement plutôt que de surgir en erreur runtime obscure plus tard.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Base Postgres (connexion directe à l'instance Supabase pendant le strangler).
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.coerce.number().int().positive().default(5432),
  DATABASE_NAME: z.string().default('manachain'),
  DATABASE_USER: z.string().default('postgres'),
  DATABASE_PASSWORD: z.string().default('postgres'),
  // TLS vers Postgres — requis par Azure Database for PostgreSQL en prod.
  DATABASE_SSL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  // JWT applicatif. DOIT être le MÊME secret que l'Express actuel pour que le
  // nouveau back valide les jetons déjà émis (bascule strangler sans re-login).
  APP_JWT_SECRET: z.string().min(32),
  APP_JWT_EXPIRES_IN: z.string().default('7d'),

  // 2FA TOTP : clé de chiffrement du secret TOTP en base (AES-256-GCM, dérivée
  // par SHA-256 — n'importe quelle chaîne ≥32 car. convient, même ergonomie
  // qu'APP_JWT_SECRET). Distincte du JWT secret : compromission indépendante.
  TWO_FACTOR_ENCRYPTION_KEY: z.string().min(32),

  // URLs front / API (liens emails, redirections OAuth).
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  API_URL: z.string().default('http://localhost:3001/api'),

  // Resend (emails transactionnels). Si non configuré → mode simulation (log).
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@contact.manachain.online'),

  // Google OAuth. Si absent → l'endpoint /auth/google renvoie une erreur claire.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Sentry (crash reporting). Vide/absent → Sentry désactivé (voir instrument.ts).
  SENTRY_DSN: z.string().optional(),

  // IPFS (Pinata). Absent → l'app boote quand même, l'upload renvoie une
  // erreur claire (IpfsStorageUnavailableError) plutôt qu'un crash au démarrage.
  PINATA_JWT: z.string().optional(),
  PINATA_GATEWAY_URL: z.string().default('https://gateway.pinata.cloud'),

  // chain-sync (miroir SQL de la chaîne). Défaut false : les e2e existants ne
  // démarrent pas le poller (aucune dépendance à un RPC/anvil).
  CHAIN_SYNC_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  CHAIN_RPC_URL: z.string().optional(),
  CHAIN_ID: z.coerce.number().int().positive().default(43113),
  CHAIN_SYNC_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
  CHAIN_SYNC_CONFIRMATIONS: z.coerce.number().int().nonnegative().default(2),
  CHAIN_SYNC_START_BLOCK: z.coerce.number().int().nonnegative().default(0),
  MANA_ADMIN_ADDRESS: z.string().optional(),
  BRAND_FACTORY_ADDRESS: z.string().optional(),
  SALE_FACTORY_ADDRESS: z.string().optional(),
  EVENT_FACTORY_ADDRESS: z.string().optional(),
  USDC_ADDRESS: z.string().optional(),

  // Bootstrap : email qui, à l'inscription, reçoit le rôle ADMIN au lieu du
  // défaut CLIENT. Absent → comportement inchangé. Sert uniquement à amorcer
  // le tout premier compte admin d'un environnement (dev/démo) sans SQL manuel.
  BOOTSTRAP_ADMIN_EMAIL: z.string().optional(),

  // Dev/démo uniquement : marque les comptes et candidatures de marque comme
  // vérifiés dès la création, sans passer par le lien email (aucun bypass
  // n'existe côté token, qui est haché en base). Ne JAMAIS activer en prod.
  SKIP_EMAIL_VERIFICATION: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export type Env = z.infer<typeof envSchema>;

export const validateEnv = (config: Record<string, unknown>): Env => {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
};
