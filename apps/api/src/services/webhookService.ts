import type Stripe from "stripe";
import { env } from "../config/env.js";
import { query } from "../db/client.js";
import { stripe } from "../stripe/client.js";

/** v2 thin event payload (Global Payouts outbound payment webhooks). */
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

export function parseWebhookPayload(rawBody: Buffer): StripeV2WebhookEvent | Stripe.Event {
  const json = JSON.parse(rawBody.toString("utf8")) as StripeV2WebhookEvent | Stripe.Event;
  return json;
}

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

export async function handleStripeWebhook(
  rawBody: Buffer,
  verifiedEvent: Stripe.Event,
): Promise<void> {
  const payload = parseWebhookPayload(rawBody);

  if ("type" in payload && payload.type.startsWith(V2_OUTBOUND_PREFIX)) {
    await handleOutboundPaymentV2Event(payload as StripeV2WebhookEvent);
    return;
  }

  await handleLegacyConnectEvent(verifiedEvent);
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

/** Legacy Connect handlers (kept for in-flight rows until fully migrated). */
async function handleLegacyConnectEvent(event: Stripe.Event): Promise<void> {
  const legacyTypes = new Set([
    "transfer.created",
    "transfer.reversed",
    "payout.paid",
    "payout.failed",
  ]);

  if (!legacyTypes.has(event.type)) {
    return;
  }

  if (event.type.startsWith("transfer.")) {
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
    return;
  }

  const payout = event.data.object as Stripe.Payout;
  const status =
    event.type === "payout.paid"
      ? "paid"
      : event.type === "payout.failed"
        ? "failed"
        : "pending";

  console.info(`[webhook] ${event.type} payout=${payout.id} status=${status}`);

  await query(
    `UPDATE payouts
     SET status = $1,
         failure_code = $2,
         failure_message = $3,
         updated_at = NOW()
     WHERE stripe_payout_id = $4`,
    [status, payout.failure_code ?? null, payout.failure_message ?? null, payout.id],
  );
}
