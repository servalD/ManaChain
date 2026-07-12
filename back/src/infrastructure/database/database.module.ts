import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Env } from '../config/env.validation';
import { TransactionRunner } from '../../shared/application/transaction-runner';
import { DatabaseContext } from './database-context';
import { TypeOrmTransactionRunner } from './typeorm-transaction-runner';
import { UserOrmEntity } from '../../modules/users/infrastructure/user.orm-entity';
import { BrandLikeOrmEntity } from '../../modules/likes/infrastructure/brand-like.orm-entity';
import { BrandOrmEntity } from '../../modules/brands/infrastructure/brand.orm-entity';
import { BrandApplicationOrmEntity } from '../../modules/brands/infrastructure/brand-application.orm-entity';
import { BrandApplicationProofUploadOrmEntity } from '../../modules/brands/infrastructure/brand-application-proof-upload.orm-entity';
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
import { NotificationOrmEntity } from '../../modules/notifications/infrastructure/notification.orm-entity';

/**
 * Connexion TypeORM unique de l'application. `SnakeNamingStrategy` colle au
 * schéma snake_case existant (table `"user"`, colonnes `first_name`…). Le schéma
 * est piloté par les migrations (`synchronize: false`) : la migration baseline
 * reproduit l'intégralité de `server/SQL/init.sql`.
 *
 * Les entités sont enregistrées au fil des modules migrés ; ajouter ici la
 * nouvelle ORM entity à chaque module (et dans `typeorm.config.ts`).
 *
 * `@Global` : expose `DatabaseContext` (contexte transactionnel ambiant) et le
 * port `TransactionRunner` à toute l'application sans réimport.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST', { infer: true }),
        port: config.get('DATABASE_PORT', { infer: true }),
        database: config.get('DATABASE_NAME', { infer: true }),
        username: config.get('DATABASE_USER', { infer: true }),
        password: config.get('DATABASE_PASSWORD', { infer: true }),
        // Chiffrement du transport sans pinning de CA (le certificat Azure
        // chaîne vers une CA absente du store par défaut de node-postgres).
        ssl: config.get('DATABASE_SSL', { infer: true })
          ? { rejectUnauthorized: false }
          : undefined,
        entities: [
          UserOrmEntity,
          BrandLikeOrmEntity,
          BrandOrmEntity,
          BrandApplicationOrmEntity,
          BrandApplicationProofUploadOrmEntity,
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
          NotificationOrmEntity,
        ],
        migrations: [__dirname + '/migrations/*.{ts,js}'],
        namingStrategy: new SnakeNamingStrategy(),
        // Le schéma est la propriété des migrations, jamais auto-synchronisé.
        synchronize: false,
        migrationsRun: false,
        autoLoadEntities: false,
      }),
    }),
  ],
  providers: [
    DatabaseContext,
    { provide: TransactionRunner, useClass: TypeOrmTransactionRunner },
  ],
  exports: [DatabaseContext, TransactionRunner],
})
export class DatabaseModule {}
