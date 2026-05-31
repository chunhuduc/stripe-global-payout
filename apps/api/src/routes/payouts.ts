import { Router } from "express";
import { requireAdmin } from "../middleware/adminAuth.js";
import {
  getPayoutById,
  initiatePayout,
} from "../services/payoutService.js";
import { StripeV2Error } from "../stripe/v2Client.js";

/** Admin-only: Global Payouts outbound payment to saved recipient. */
export const payoutsRouter = Router();

payoutsRouter.post("/", requireAdmin, async (req, res) => {
  try {
    const { payeeId, amount, currency } = req.body as {
      payeeId?: string;
      amount?: number;
      currency?: string;
    };

    if (!payeeId || typeof amount !== "number" || amount <= 0) {
      res.status(400).json({
        error: "payeeId and positive amount (minor units) are required",
      });
      return;
    }

    const result = await initiatePayout({
      payeeId,
      amount,
      currency,
    });

    res.status(201).json(result);
  } catch (err: unknown) {
    if (err instanceof StripeV2Error) {
      console.error("initiatePayout Stripe v2 failed", err.body);
      res.status(err.status >= 400 && err.status < 500 ? err.status : 502).json({
        error: err.message,
        stripe: err.body,
      });
      return;
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("initiatePayout failed", err);
    const status = message.includes("STRIPE_FINANCIAL_ACCOUNT_ID") ? 503 : 500;
    res.status(status).json({ error: message });
  }
});

/** Read payout status (updates via outbound payment webhooks). */
payoutsRouter.get("/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const payout = await getPayoutById(id);
    if (!payout) {
      res.status(404).json({ error: "Payout not found" });
      return;
    }
    res.json({ payout });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});
