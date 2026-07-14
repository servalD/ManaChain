import * as Sentry from '@sentry/nextjs';
import { scrubBreadcrumb, scrubEvent } from './lib/sentry-scrub';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    beforeBreadcrumb: scrubBreadcrumb,
    beforeSend: scrubEvent,
    beforeSendTransaction: scrubEvent,
  });
}
