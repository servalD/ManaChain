import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { UserOrmEntity } from '../../modules/users/infrastructure/user.orm-entity';
import { BrandLikeOrmEntity } from '../../modules/likes/infrastructure/brand-like.orm-entity';
import { BrandOrmEntity } from '../../modules/brands/infrastructure/brand.orm-entity';
import { BrandApplicationOrmEntity } from '../../modules/brands/infrastructure/brand-application.orm-entity';
import { BrandMediaOrmEntity } from '../../modules/brands/infrastructure/brand-media.orm-entity';
import { BrandTokenOrmEntity } from '../../modules/tokens/infrastructure/brand-token.orm-entity';
import { TokenHolderOrmEntity } from '../../modules/tokens/infrastructure/token-holder.orm-entity';
import { TokenTransactionOrmEntity } from '../../modules/tokens/infrastructure/token-transaction.orm-entity';
import { ChainSyncCursorOrmEntity } from '../../modules/chain-sync/infrastructure/chain-sync-cursor.orm-entity';
import { BrandContractsOrmEntity } from '../../modules/chain-sync/infrastructure/brand-contracts.orm-entity';
import { TokenSaleOrmEntity } from '../../modules/chain-sync/infrastructure/token-sale.orm-entity';
import { EventContractsOrmEntity } from '../../modules/chain-sync/infrastructure/event-contracts.orm-entity';
import { EventTicketTypeOrmEntity } from '../../modules/chain-sync/infrastructure/event-ticket-type.orm-entity';
import { EventTicketPurchaseOrmEntity } from '../../modules/chain-sync/infrastructure/event-ticket-purchase.orm-entity';
import { EventOrmEntity } from '../../modules/events/infrastructure/event.orm-entity';

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
  ssl:
    process.env.DATABASE_SSL === 'true'
      ? { rejectUnauthorized: false }
      : undefined,
  entities: [
    UserOrmEntity,
    BrandLikeOrmEntity,
    BrandOrmEntity,
    BrandApplicationOrmEntity,
    BrandMediaOrmEntity,
    BrandTokenOrmEntity,
    TokenHolderOrmEntity,
    TokenTransactionOrmEntity,
    ChainSyncCursorOrmEntity,
    BrandContractsOrmEntity,
    TokenSaleOrmEntity,
    EventContractsOrmEntity,
    EventTicketTypeOrmEntity,
    EventTicketPurchaseOrmEntity,
    EventOrmEntity,
  ],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
});
