import type Stripe from "stripe";
import { env } from "../config/env.js";
import { query } from "../db/client.js";
import { stripe } from "../stripe/client.js";

const HANDLED_EVENTS = new Set(["payout.paid", "payout.failed"]);

export function constructStripeEvent(
  rawBody: Buffer,
  signature: string,
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    env.stripeWebhookSecret,
  );
}

/**
 * Insert event.id once; return false if duplicate (Stripe retry).
 */
export async function recordWebhookEvent(
  event: Stripe.Event,
): Promise<boolean> {
  try {
    await query(
      `INSERT INTO stripe_webhook_events (event_id, type, payload_json)
       VALUES ($1, $2, $3)`,
      [event.id, event.type, JSON.stringify(event.data.object)],
    );
    return true;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "23505") {
      return false;
    }
    throw err;
  }
}

export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  if (!HANDLED_EVENTS.has(event.type)) {
    return;
  }

  const payout = event.data.object as Stripe.Payout;
  const stripePayoutId = payout.id;

  const status =
    event.type === "payout.paid"
      ? "paid"
      : event.type === "payout.failed"
        ? "failed"
        : "pending";

  const failureCode = payout.failure_code ?? null;
  const failureMessage = payout.failure_message ?? null;

  await query(
    `UPDATE payouts
     SET status = $1,
         failure_code = $2,
         failure_message = $3,
         updated_at = NOW()
     WHERE stripe_payout_id = $4`,
    [status, failureCode, failureMessage, stripePayoutId],
  );
}
