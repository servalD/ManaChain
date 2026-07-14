# Monitoring — back

## `/metrics`

Exposé par `@willsoto/nestjs-prometheus` (`src/infrastructure/monitoring/`), en
dehors du préfixe `/api` — comme `/health` — pour rester injoignable via le
router traefik de prod (qui ne route que `PathPrefix(/api)`, cf.
[infra/MONITORING.md](../../infra/MONITORING.md)) :

```bash
curl http://localhost:3001/metrics
```

Public (`@Public()`, pas de Bearer requis — c'est une route de scrape, pas une
route applicative) et exclu du Swagger (`@ApiExcludeController()`).

Métriques par défaut de `prom-client` uniquement (event loop lag, heap V8, GC,
mémoire résidente du process — voir le dashboard Grafana « Back (Node.js) »).
**Pas d'histogramme HTTP applicatif** (durée de requête, codes par route) :
traefik le fournit déjà côté edge (`traefik_router_request_duration_seconds`,
dashboard « Edge (Traefik) ») — le dupliquer côté back violerait le principe
« zéro redondance entre collecteurs » du plan d'observabilité.

## Sentry (crash reporting)

`src/instrument.ts`, importé en première ligne de `main.ts` (avant tout autre
module, requis par Sentry pour instrumenter les imports suivants). Conditionné
à la variable `SENTRY_DSN` : vide/absente → Sentry désactivé (dev local, CI).
`tracesSampleRate: 0.1`. `AllExceptionsFilter` (`app.module.ts`, unique
`APP_FILTER`) appelle `Sentry.captureException(...)` pour les exceptions
imprévues (5xx) avant de construire la réponse HTTP — remplace l'ancien duo
`SentryGlobalFilter` + `DomainExceptionFilter`.

## Profil dev

```bash
docker compose -f docker/docker-compose.dev.yml --profile monitoring up
```

Ajoute Prometheus (`:9090`, cible statique `back:3001` + `cadvisor:8080`,
rétention 2 jours) et Grafana (`:3002`, accès anonyme Admin — pas de mot de
passe en dev) sans toucher au flux `up` habituel (services opt-in). Mêmes
dashboards que la prod (`deploy/monitoring/grafana/dashboards/`, montés tels
quels — zéro duplication) ; l'alerte Telegram n'est pas chargée en dev (le
fichier `alerting.yml.j2` n'est jamais rendu hors Ansible).
