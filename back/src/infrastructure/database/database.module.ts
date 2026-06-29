import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Env } from '../config/env.validation';
import { UserOrmEntity } from '../../modules/users/infrastructure/user.orm-entity';
import { BrandLikeOrmEntity } from '../../modules/likes/infrastructure/brand-like.orm-entity';
import { BrandOrmEntity } from '../../modules/brands/infrastructure/brand.orm-entity';
import { BrandApplicationOrmEntity } from '../../modules/brands/infrastructure/brand-application.orm-entity';
import { BrandMediaOrmEntity } from '../../modules/brands/infrastructure/brand-media.orm-entity';
import { BrandTokenOrmEntity } from '../../modules/tokens/infrastructure/brand-token.orm-entity';
import { TokenHolderOrmEntity } from '../../modules/tokens/infrastructure/token-holder.orm-entity';
import { TokenTransactionOrmEntity } from '../../modules/tokens/infrastructure/token-transaction.orm-entity';

/**
 * Connexion TypeORM unique de l'application. `SnakeNamingStrategy` colle au
 * schéma snake_case existant (table `"user"`, colonnes `first_name`…). Le schéma
 * est piloté par les migrations (`synchronize: false`) : la migration baseline
 * reproduit l'intégralité de `server/SQL/init.sql`.
 *
 * Les entités sont enregistrées au fil des modules migrés ; ajouter ici la
 * nouvelle ORM entity à chaque module (et dans `typeorm.config.ts`).
 */
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
        entities: [
          UserOrmEntity,
          BrandLikeOrmEntity,
          BrandOrmEntity,
          BrandApplicationOrmEntity,
          BrandMediaOrmEntity,
          BrandTokenOrmEntity,
          TokenHolderOrmEntity,
          TokenTransactionOrmEntity,
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
})
export class DatabaseModule {}
