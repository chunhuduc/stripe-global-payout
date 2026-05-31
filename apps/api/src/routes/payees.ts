import { Router } from "express";
import { requireAdmin } from "../middleware/adminAuth.js";
import { createPayee } from "../services/payeeService.js";
import { StripeV2Error } from "../stripe/v2Client.js";
import { normalizePayeeBody } from "../utils/normalizePayeeBody.js";

/** Admin-only: create Global Payouts recipient + bank payout method (Jordan wire first). */
export const payeesRouter = Router();

payeesRouter.post("/", requireAdmin, async (req, res) => {
  try {
    const input = normalizePayeeBody(req.body);

    if (!input) {
      res.status(400).json({
        error:
          "Provide bank (iban, swift) and either name or individual (firstName, lastName). Optional: countryCode (default JO), email. Phase 1: JO wire.",
      });
      return;
    }

    const result = await createPayee(input);
    res.status(201).json(result);
  } catch (err: unknown) {
    if (err instanceof StripeV2Error) {
      console.error("createPayee Stripe v2 failed", err.body);
      res.status(err.status >= 400 && err.status < 500 ? err.status : 502).json({
        error: err.message,
        stripe: err.body,
      });
      return;
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("createPayee failed", err);
    res.status(500).json({ error: message });
  }
});
