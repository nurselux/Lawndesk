import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isDSNSet = !!dsn && dsn.includes('sentry.io');

console.log('[Sentry Client] Initializing - DSN set:', isDSNSet);

const integrations = [];

if (typeof Sentry.replayIntegration === 'function') {
  integrations.push(Sentry.replayIntegration());
}

if (isDSNSet) {
  Sentry.init({
    dsn,
    integrations,
    tracesSampleRate: 1,
    environment: process.env.NODE_ENV,
  });
  console.log('[Sentry Client] Initialized successfully');
} else {
  console.warn('[Sentry Client] Warning: DSN not properly set');
}
