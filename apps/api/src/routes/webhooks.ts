import { Router } from "express";
import express from "express";
import {
  constructStripeEvent,
  handleStripeWebhook,
  recordWebhookEvent,
} from "../services/webhookService.js";

export const webhooksRouter = Router();

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
