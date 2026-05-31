import express from "express";
import { healthRouter } from "./routes/health.js";
import { payeesRouter } from "./routes/payees.js";
import { payoutsRouter } from "./routes/payouts.js";
import { webhooksRouter } from "./routes/webhooks.js";

/**
 * Express app factory (local dev + Vercel via api/index.ts).
 * Route order matters: /webhooks before express.json() so Stripe signatures use the raw body.
 */
export function createApp(): express.Express {
  const app = express();

  app.use(healthRouter);

  // Webhooks MUST register before express.json(): Stripe signature needs the raw body.
  app.use("/webhooks", webhooksRouter);

  app.use(express.json());
  app.use("/api/payees", payeesRouter);
  app.use("/api/payouts", payoutsRouter);

  return app;
}

/** Vercel @vercel/node requires a default export that is an Express app or handler. */
export default createApp();
