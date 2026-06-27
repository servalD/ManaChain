import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { UserOrmEntity } from '../../modules/users/infrastructure/user.orm-entity';

// DataSource autonome utilisé UNIQUEMENT par la CLI TypeORM (migration:generate
// / run / revert). L'app, elle, passe par DatabaseModule. Garder les deux alignés.
loadEnv();

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  database: process.env.DATABASE_NAME ?? 'manachain',
  username: process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'postgres',
  entities: [UserOrmEntity],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
});
