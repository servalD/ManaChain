import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { register } from 'prom-client';
import { DataSource } from 'typeorm';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AppTokenService } from '../src/modules/auth/application/ports/app-token.service';
import { PasswordHasher } from '../src/modules/auth/application/ports/password-hasher.port';
import { User } from '../src/modules/users/domain/user';
import { UserRepository } from '../src/modules/users/domain/user.repository';
import { Role } from '../src/shared/enums/role.enum';

export interface E2EContext {
  app: INestApplication<App>;
  dataSource: DataSource;
}

/**
 * Démarre l'application complète (AppModule) contre la vraie base Postgres de
 * test, en reproduisant la configuration de `main.ts` (préfixe global `/api` sauf
 * `/health` et `/metrics`, ValidationPipe strict). Repart d'un schéma VIERGE : on drop puis on
 * rejoue les migrations (baseline + colonnes) — ce qui couvre aussi la migration.
 */
export async function createE2EApp(): Promise<E2EContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<INestApplication<App>>();
  app.setGlobalPrefix('api', { exclude: ['health', 'metrics'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const dataSource = app.get(DataSource);
  await dataSource.dropDatabase();
  await dataSource.runMigrations();

  await app.init();
  return { app, dataSource };
}

/** Ferme proprement l'app et supprime le schéma de test. */
export async function destroyE2EApp(ctx: E2EContext): Promise<void> {
  await ctx.dataSource.dropDatabase();
  await ctx.app.close();
  // Le registre prom-client est global au process : sans ça, les métriques
  // par défaut (déjà enregistrées par prom-client lui-même) entrent en
  // conflit d'un fichier e2e-spec à l'autre.
  register.clear();
}

export interface SeedUserOptions {
  email: string;
  username: string;
  password?: string;
  role?: Role;
  isBrand?: boolean;
  verified?: boolean;
}

/**
 * Insère un utilisateur directement en base (mot de passe haché via le vrai
 * {@link PasswordHasher}) et renvoie le modèle de domaine rechargé.
 */
export async function seedUser(
  ctx: E2EContext,
  options: SeedUserOptions,
): Promise<User> {
  const hasher = ctx.app.get(PasswordHasher);
  const users = ctx.app.get(UserRepository);
  const passwordHash = await hasher.hash(options.password ?? 'Password123!');

  const rows = await ctx.dataSource.query<{ id: string }[]>(
    `INSERT INTO "user"
       (email, username, first_name, last_name, password_hash, age_range,
        verified, is_brand, role)
     VALUES ($1, $2, $3, $4, $5, '25-34', $6, $7, $8)
     RETURNING id`,
    [
      options.email,
      options.username,
      'First',
      'Last',
      passwordHash,
      options.verified ?? true,
      options.isBrand ?? false,
      options.role ?? Role.CLIENT,
    ],
  );

  const user = await users.findById(rows[0].id);
  if (!user) {
    throw new Error('seedUser: user not found after insert');
  }
  return user;
}

/** Signe un JWT applicatif réel pour un utilisateur (mêmes claims que le login). */
export function signToken(ctx: E2EContext, user: User): string {
  return ctx.app.get(AppTokenService).sign({
    userId: user.id,
    email: user.email,
    isBrand: user.isBrand,
    verified: user.verified,
  });
}

export const bearer = (token: string): [string, string] => [
  'Authorization',
  `Bearer ${token}`,
];
