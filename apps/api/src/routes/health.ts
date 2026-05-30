import { Router } from "express";

export const healthRouter = Router();

function healthPayload() {
  return {
    ok: true,
    service: "stripe-connect-payout-api",
    endpoints: {
      health: "GET /health",
      saveFreelancer: "POST /api/payees (name + bank, or individual + bank)",
      triggerPayout: "POST /api/payouts",
      payoutStatus: "GET /api/payouts/:id",
      webhooks:
        "POST /webhooks/stripe (transfer.created, transfer.reversed, payout.paid, payout.failed)",
    },
  };
}

healthRouter.get("/", (_req, res) => {
  res.json(healthPayload());
});

healthRouter.get("/health", (_req, res) => {
  res.json(healthPayload());
});
