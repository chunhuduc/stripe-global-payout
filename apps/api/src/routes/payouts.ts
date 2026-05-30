import { Router } from "express";
import { requireAdmin } from "../middleware/adminAuth.js";
import { initiatePayout } from "../services/payoutService.js";

/** Admin-only: transfer + payout to a payee's connected account and bank. */
export const payoutsRouter = Router();

payoutsRouter.post("/", requireAdmin, async (req, res) => {
  try {
    const { payeeId, amount, currency, transferCurrency } = req.body as {
      payeeId?: string;
      amount?: number;
      currency?: string;
      transferCurrency?: string;
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
      transferCurrency,
    });

    res.status(201).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("initiatePayout failed", err);
    res.status(500).json({ error: message });
  }
});
