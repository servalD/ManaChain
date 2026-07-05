import * as Sentry from '@sentry/nextjs';

// DSN front public par nature (inlinée au build, cf. Dockerfile) : pas de secret.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}
