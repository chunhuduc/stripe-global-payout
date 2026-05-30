import { Router } from "express";
import { requireAdmin } from "../middleware/adminAuth.js";
import { createPayee } from "../services/payeeService.js";
import type { CreatePayeeInput } from "../config/countries/types.js";

/** Admin-only: create Connect Custom payee + bank (no recipient Stripe login). */
export const payeesRouter = Router();

payeesRouter.post("/", requireAdmin, async (req, res) => {
  try {
    const body = req.body as CreatePayeeInput;

    if (!body.countryCode || !body.individual || !body.bank) {
      res.status(400).json({
        error: "countryCode, individual, and bank are required",
      });
      return;
    }

    const result = await createPayee(body);
    res.status(201).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("createPayee failed", err);
    res.status(500).json({ error: message });
  }
});
