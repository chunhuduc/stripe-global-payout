import { Router } from "express";

export const healthRouter = Router();

function healthPayload() {
  return {
    ok: true,
    service: "stripe-global-payouts-api",
    product: "Stripe Global Payouts (recipients + outbound payments)",
    endpoints: {
      health: "GET /health",
      saveRecipient:
        "POST /api/payees (name + bank, or individual + bank; default country JO wire)",
      triggerPayout: "POST /api/payouts (requires STRIPE_FINANCIAL_ACCOUNT_ID)",
      payoutStatus: "GET /api/payouts/:id",
      webhooks:
        "POST /webhooks/stripe (v2.money_management.outbound_payment.*; legacy Connect optional)",
    },
  };
}

healthRouter.get("/", (_req, res) => {
  res.json(healthPayload());
});

healthRouter.get("/health", (_req, res) => {
  res.json(healthPayload());
});
