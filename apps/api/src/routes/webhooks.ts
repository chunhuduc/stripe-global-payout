import { Router } from "express";
import express from "express";
import {
  constructStripeEvent,
  handleStripeWebhook,
  parseWebhookPayload,
  recordWebhookEvent,
} from "../services/webhookService.js";

export const webhooksRouter = Router();

/**
 * Stripe webhooks for Global Payouts outbound payments (v2 thin events).
 * Requires raw body (registered before express.json in app.ts).
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
      constructStripeEvent(rawBody, signature);
      const payload = parseWebhookPayload(rawBody);
      const eventId = payload.id;
      const eventType = payload.type;

      const isNew = await recordWebhookEvent(eventId, eventType, payload);
      if (!isNew) {
        res.json({ received: true, duplicate: true });
        return;
      }

      await handleStripeWebhook(rawBody);
      res.json({ received: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Webhook error";
      console.error("webhook failed", err);
      res.status(400).send(`Webhook Error: ${message}`);
    }
  },
);
