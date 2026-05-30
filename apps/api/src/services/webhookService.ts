import type Stripe from "stripe";
import { env } from "../config/env.js";
import { query } from "../db/client.js";
import { stripe } from "../stripe/client.js";

/**
 * Stripe Connect transfer webhooks use transfer.created / transfer.reversed (not transfer.paid).
 * We map those to transfer_status paid/failed to match trial wording in docs.
 * Bank delivery uses payout.paid / payout.failed.
 */
const HANDLED_EVENTS = new Set([
  "transfer.created",
  "transfer.reversed",
  "payout.paid",
  "payout.failed",
]);

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

  if (event.type.startsWith("transfer.")) {
    await handleTransferEvent(event);
    return;
  }

  await handlePayoutEvent(event);
}

async function handleTransferEvent(event: Stripe.Event): Promise<void> {
  const transfer = event.data.object as Stripe.Transfer;
  const transferStatus =
    event.type === "transfer.created"
      ? "paid"
      : event.type === "transfer.reversed"
        ? "failed"
        : "pending";

  console.info(
    `[webhook] ${event.type} transfer=${transfer.id} transfer_status=${transferStatus}`,
  );

  await query(
    `UPDATE payouts
     SET transfer_status = $1,
         updated_at = NOW()
     WHERE stripe_transfer_id = $2`,
    [transferStatus, transfer.id],
  );
}

async function handlePayoutEvent(event: Stripe.Event): Promise<void> {
  const payout = event.data.object as Stripe.Payout;
  const status =
    event.type === "payout.paid"
      ? "paid"
      : event.type === "payout.failed"
        ? "failed"
        : "pending";

  const failureCode = payout.failure_code ?? null;
  const failureMessage = payout.failure_message ?? null;

  console.info(
    `[webhook] ${event.type} payout=${payout.id} status=${status}`,
  );

  await query(
    `UPDATE payouts
     SET status = $1,
         failure_code = $2,
         failure_message = $3,
         updated_at = NOW()
     WHERE stripe_payout_id = $4`,
    [status, failureCode, failureMessage, payout.id],
  );
}
