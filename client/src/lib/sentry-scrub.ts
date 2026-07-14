import type { Breadcrumb, Event } from '@sentry/nextjs';

/**
 * Query params qui ne doivent jamais atteindre Sentry : tokens de session ou
 * d'échange transitant (brièvement, pour ticket/challengeToken) par l'URL.
 * Défense en profondeur — ces valeurs sont censées être à usage unique et de
 * courte durée de vie, mais Sentry capture les URL complètes par défaut dans
 * les breadcrumbs de navigation et le contexte de requête.
 */
const SENSITIVE_PARAMS = ['ticket', 'challengeToken', 'token', 'refreshToken'];

function scrubUrl(url: string): string {
  const isAbsolute = /^[a-z][a-z0-9+.-]*:\/\//i.test(url);
  let parsed: URL;
  try {
    parsed = new URL(url, isAbsolute ? undefined : 'http://scrub.invalid');
  } catch {
    return url;
  }

  let changed = false;
  for (const key of SENSITIVE_PARAMS) {
    if (parsed.searchParams.has(key)) {
      parsed.searchParams.set(key, '[Filtered]');
      changed = true;
    }
  }
  if (!changed) return url;

  return isAbsolute
    ? parsed.toString()
    : `${parsed.pathname}?${parsed.searchParams.toString()}${parsed.hash}`;
}

export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  if (breadcrumb.data) {
    for (const key of ['url', 'to', 'from'] as const) {
      const value = breadcrumb.data[key];
      if (typeof value === 'string') {
        breadcrumb.data[key] = scrubUrl(value);
      }
    }
  }
  return breadcrumb;
}

export function scrubEvent<T extends Event>(event: T): T {
  if (event.request?.url) {
    event.request.url = scrubUrl(event.request.url);
  }
  event.breadcrumbs = event.breadcrumbs?.map(scrubBreadcrumb);
  return event;
}
