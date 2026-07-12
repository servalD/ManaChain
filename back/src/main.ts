// Import en premier : Sentry doit instrumenter les autres modules au chargement.
import './instrument';

import { join } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { Env } from './infrastructure/config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService<Env, true>);

  // 1 hop : traefik tourne en mode host sur le manager (deploy/stack.yml.j2).
  // Sans ça, le ThrottlerGuard verrait l'IP de l'overlay pour toutes les
  // requêtes prod et son garde-fou par IP deviendrait global.
  app.set('trust proxy', 1);

  // CSP désactivée : API JSON pure, elle casserait sinon Swagger UI
  // (scripts inline sur /api/docs) sans bénéfice pour les autres routes.
  // CORP cross-origin : /api/assets/ (logo des emails) est chargé par des
  // clients mail sur d'autres origines.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Assets statiques (logo des emails) servis sous /api/assets.
  app.useStaticAssets(join(__dirname, '..', 'assets'), {
    prefix: '/api/assets/',
  });

  // Toutes les routes sous /api ; /health et /metrics restent à la racine
  // (healthcheck et scrape Prometheus, jamais routés par traefik en prod).
  app.setGlobalPrefix('api', { exclude: ['health', 'metrics'] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }),
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ManaChain API')
    .setDescription('Documentation de l’API ManaChain')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
