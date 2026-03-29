import * as Sentry from "@sentry/nextjs";

const integrations = [];

if (typeof Sentry.replayIntegration === 'function') {
  integrations.push(Sentry.replayIntegration());
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations,
  tracesSampleRate: 1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
