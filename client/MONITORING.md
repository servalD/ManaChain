# Monitoring — client

## `/health`

Route Next.js (`src/app/health/route.ts`, `dynamic = 'force-dynamic'`) qui ne
sert qu'au `HEALTHCHECK` du `Dockerfile` (`wget` interne au conteneur,
`localhost:3000/health`). Elle n'est **jamais exposée publiquement** : en
prod, le router traefik du client exclut explicitement `/health`
(`&& !PathPrefix(\`/health\`)`, `deploy/stack.yml.j2`) — voir
[infra/MONITORING.md](../infra/MONITORING.md) pour le détail du modèle
d'isolation.

## Sentry (crash reporting)

Setup manuel (pas de `withSentryConfig` — évite l'upload de sourcemaps et le
couplage avec Turbopack) : `src/instrumentation.ts` (+ `onRequestError` pour
les Server Components/middleware/route handlers), `src/instrumentation-client.ts`
(navigateur), `src/sentry.server.config.ts`, `src/sentry.edge.config.ts`.
Chaque `Sentry.init` est gardé par `NEXT_PUBLIC_SENTRY_DSN` non vide — DSN
front public par nature, inliné au build (`Dockerfile` ARG/ENV, comme les
autres `NEXT_PUBLIC_*`).

## Pas de métriques applicatives

Aucune instrumentation Prometheus côté client (cf. tableau anti-redondance du
plan d'observabilité) : cAdvisor couvre déjà CPU/RAM/réseau par conteneur, et
traefik couvre les métriques HTTP edge (req/s, latences, codes). Ajouter un
`/metrics` ici serait redondant.

## Profil dev

```bash
docker compose -f docker/docker-compose.dev.yml --profile monitoring up
```

Prometheus (`:9090`, cadvisor uniquement) + Grafana (`:3002`, accès anonyme
Admin) en opt-in, dashboards réutilisés depuis `deploy/monitoring/grafana/`.
