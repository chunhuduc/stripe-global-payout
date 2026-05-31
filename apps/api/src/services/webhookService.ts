import type Stripe from "stripe";
import { env } from "../config/env.js";
import { query } from "../db/client.js";
import { stripe } from "../stripe/client.js";

/**
 * Global Payouts sends "thin" v2 webhook payloads (not the classic Event.data.object shape).
 * We match payouts by related_object.id = stripe_outbound_payment_id.
 */
export type StripeV2WebhookEvent = {
  id: string;
  type: string;
  object?: string;
  related_object?: {
    id: string;
    type: string;
  };
};

const V2_OUTBOUND_PREFIX = "v2.money_management.outbound_payment.";

/** Verifies Stripe-Signature using STRIPE_WEBHOOK_SECRET. */
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

export function parseWebhookPayload(rawBody: Buffer): StripeV2WebhookEvent {
  return JSON.parse(rawBody.toString("utf8")) as StripeV2WebhookEvent;
}

/** Returns true if this event id was new; false if duplicate (Postgres unique on event_id). */
export async function recordWebhookEvent(
  eventId: string,
  eventType: string,
  payload: unknown,
): Promise<boolean> {
  try {
    await query(
      `INSERT INTO stripe_webhook_events (event_id, type, payload_json)
       VALUES ($1, $2, $3)`,
      [eventId, eventType, JSON.stringify(payload)],
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

export async function handleStripeWebhook(rawBody: Buffer): Promise<void> {
  const payload = parseWebhookPayload(rawBody);

  if (!payload.type.startsWith(V2_OUTBOUND_PREFIX)) {
    console.warn(`[webhook] ignored event type: ${payload.type}`);
    return;
  }

  await handleOutboundPaymentV2Event(payload);
}

async function handleOutboundPaymentV2Event(event: StripeV2WebhookEvent): Promise<void> {
  const outboundPaymentId = event.related_object?.id;
  if (!outboundPaymentId) {
    console.warn(`[webhook] ${event.type} missing related_object.id`);
    return;
  }

  const status = mapV2OutboundEventType(event.type);

  console.info(
    `[webhook] ${event.type} outbound_payment=${outboundPaymentId} status=${status}`,
  );

  await query(
    `UPDATE payouts
     SET status = $1,
         updated_at = NOW()
     WHERE stripe_outbound_payment_id = $2`,
    [status, outboundPaymentId],
  );
}

/** Maps Stripe outbound payment lifecycle to payouts.status in Postgres. */
function mapV2OutboundEventType(eventType: string): string {
  const suffix = eventType.slice(V2_OUTBOUND_PREFIX.length);
  switch (suffix) {
    case "posted":
      return "paid";
    case "failed":
    case "returned":
      return "failed";
    case "canceled":
      return "canceled";
    case "created":
    case "processing":
    default:
      return "pending";
  }
}
