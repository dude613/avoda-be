import dotenv from "dotenv"; // Import dotenv
dotenv.config(); // Load .env variables FIRST within instrument.js

import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
//import { expressIntegration } from "@sentry/node"; // Keep import uncommented

Sentry.init({
  dsn: process.env.SEN_DSN,
  debug: process.env.SEN_DEBUG === "true" || false,
  integrations: [
    //expressIntegration(),
    nodeProfilingIntegration(),
  ],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions

  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});
