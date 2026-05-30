import type Stripe from "stripe";
import { env } from "../config/env.js";
import { query } from "../db/client.js";
import { stripe } from "../stripe/client.js";

/** Phase 1 scope: payout status only (add account.updated in phase 2 for onboarding UX). */
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
 * Persist Stripe event.id before side effects.
 * Returns false on duplicate (Postgres 23505) so retries are acknowledged without re-running updates.
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

/** Sync payout row status from Stripe webhook payload (matched by stripe_payout_id). */
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
