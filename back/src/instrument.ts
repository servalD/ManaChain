import * as Sentry from '@sentry/nestjs';

// Doit être importé en première ligne de main.ts, avant tout autre module :
// Sentry instrumente les autres imports au chargement. Désactivé si aucun DSN
// n'est fourni (dev local, CI).
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}
