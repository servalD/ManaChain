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

  // JWT applicatif. DOIT être le MÊME secret que l'Express actuel pour que le
  // nouveau back valide les jetons déjà émis (bascule strangler sans re-login).
  APP_JWT_SECRET: z.string().min(16),
  APP_JWT_EXPIRES_IN: z.string().default('7d'),
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
