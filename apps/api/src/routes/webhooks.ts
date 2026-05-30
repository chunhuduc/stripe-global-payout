import { Router } from "express";
import express from "express";
import {
  constructStripeEvent,
  handleStripeWebhook,
  recordWebhookEvent,
} from "../services/webhookService.js";

export const webhooksRouter = Router();

/**
 * Stripe platform webhooks. Configure transfer + payout events in Dashboard (see docs/WEBHOOKS.md).
 * No admin key: authenticity is the Stripe-Signature header + STRIPE_WEBHOOK_SECRET.
 */
webhooksRouter.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature || typeof signature !== "string") {
      res.status(400).send("Missing stripe-signature header");
      return;
    }

    try {
      const rawBody = req.body as Buffer;
      const event = constructStripeEvent(rawBody, signature);

      // Dedupe by event.id so Stripe retries do not double-update payout rows.
      const isNew = await recordWebhookEvent(event);
      if (!isNew) {
        res.json({ received: true, duplicate: true });
        return;
      }

      await handleStripeWebhook(event);
      res.json({ received: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Webhook error";
      console.error("webhook failed", err);
      res.status(400).send(`Webhook Error: ${message}`);
    }
  },
);
