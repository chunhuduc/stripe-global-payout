import { Router } from "express";
import { requireAdmin } from "../middleware/adminAuth.js";
import { createPayee } from "../services/payeeService.js";
import { normalizePayeeBody } from "../utils/normalizePayeeBody.js";

/** Admin-only: create Connect Custom payee + bank (no recipient Stripe login). */
export const payeesRouter = Router();

payeesRouter.post("/", requireAdmin, async (req, res) => {
  try {
    const input = normalizePayeeBody(req.body);

    if (!input) {
      res.status(400).json({
        error:
          "Provide bank (iban, swift) and either name or individual (firstName, lastName). Optional: countryCode (default JO), email.",
      });
      return;
    }

    const result = await createPayee(input);
    res.status(201).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("createPayee failed", err);
    res.status(500).json({ error: message });
  }
});
