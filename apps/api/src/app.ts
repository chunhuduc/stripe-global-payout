import express from "express";
import { healthRouter } from "./routes/health.js";
import { payeesRouter } from "./routes/payees.js";
import { payoutsRouter } from "./routes/payouts.js";
import { webhooksRouter } from "./routes/webhooks.js";

/**
 * Express app factory (local dev + Vercel serverless via api/index.ts).
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
