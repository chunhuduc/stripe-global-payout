import { Router } from "express";

export const healthRouter = Router();

function healthPayload() {
  return {
    ok: true,
    service: "stripe-connect-payout-api"
  };
}

healthRouter.get("/", (_req, res) => {
  res.json(healthPayload());
});

healthRouter.get("/health", (_req, res) => {
  res.json(healthPayload());
});
