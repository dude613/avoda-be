import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
//import { expressIntegration } from "@sentry/node"; // Correct import for ESM

Sentry.init({
  dsn: process.env.SEN_DSN,
  debug: true, // Enable debug logging
  integrations: [
    //expressIntegration(), // Use the imported integration
    nodeProfilingIntegration(),
  ],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions

  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});
