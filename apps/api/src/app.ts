import express from "express";
import { healthRouter } from "./routes/health.js";
import { payeesRouter } from "./routes/payees.js";
import { payoutsRouter } from "./routes/payouts.js";
import { webhooksRouter } from "./routes/webhooks.js";

export function createApp(): express.Express {
  const app = express();

  app.use(healthRouter);
  app.use("/webhooks", webhooksRouter);
  app.use(express.json());
  app.use("/api/payees", payeesRouter);
  app.use("/api/payouts", payoutsRouter);

  return app;
}
