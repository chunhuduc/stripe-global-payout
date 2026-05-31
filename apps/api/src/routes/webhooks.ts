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
 * Stripe webhooks: Global Payouts v2 outbound payment events + legacy Connect (if any).
 * Authenticity: Stripe-Signature + STRIPE_WEBHOOK_SECRET.
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
      const verified = constructStripeEvent(rawBody, signature);
      const payload = parseWebhookPayload(rawBody);
      const eventId = payload.id;
      const eventType = "type" in payload ? String(payload.type) : verified.type;

      const isNew = await recordWebhookEvent(eventId, eventType, payload);
      if (!isNew) {
        res.json({ received: true, duplicate: true });
        return;
      }

      await handleStripeWebhook(rawBody, verified);
      res.json({ received: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Webhook error";
      console.error("webhook failed", err);
      res.status(400).send(`Webhook Error: ${message}`);
    }
  },
);
