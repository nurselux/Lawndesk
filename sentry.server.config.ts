import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;
const isDSNSet = !!dsn && dsn.includes('sentry.io');

console.log('[Sentry Server] Initializing - DSN set:', isDSNSet);

if (isDSNSet) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1,
    environment: process.env.NODE_ENV,
  });
  console.log('[Sentry Server] Initialized successfully');
} else {
  console.warn('[Sentry Server] Warning: DSN not properly set');
}
