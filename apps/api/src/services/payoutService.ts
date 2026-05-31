import { v4 as uuidv4 } from "uuid";
import { getCountryConfig } from "../config/countries/index.js";
import { query } from "../db/client.js";
import { createOutboundPayment } from "../stripe/outboundPayments.js";
import { getPayeeById } from "./payeeService.js";

export interface InitiatePayoutInput {
  payeeId: string;
  /** Amount in minor units (e.g. 1000 fils for 10.00 JOD). */
  amount: number;
  currency?: string;
}

/**
 * Creates a Stripe Outbound Payment and stores a pending payout row.
 * Final status is updated by webhooks (see webhookService.ts).
 */
export async function initiatePayout(input: InitiatePayoutInput) {
  const payee = await getPayeeById(input.payeeId);
  if (!payee) {
    throw new Error(`Payee not found: ${input.payeeId}`);
  }

  const recipientId = payee.stripe_recipient_id as string | undefined;
  const payoutMethodId = payee.stripe_payout_method_id as string | undefined;
  if (!recipientId || !payoutMethodId) {
    throw new Error("Payee is missing Stripe recipient or payout method ids");
  }

  const country = getCountryConfig(payee.country_code as string);
  const currency = (input.currency ?? country.defaultCurrency).toLowerCase();
  const idempotencyKey = uuidv4();

  const outbound = await createOutboundPayment({
    recipientId,
    payoutMethodId,
    amount: input.amount,
    currency,
    description: `Payout ${idempotencyKey}`,
  });

  const status = mapOutboundPaymentStatus(outbound.status);

  const result = await query(
    `INSERT INTO payouts (
       payee_id, stripe_outbound_payment_id, amount, currency, status, idempotency_key
     ) VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [payee.id, outbound.id, input.amount, currency, status, idempotencyKey],
  );

  return {
    payout: result.rows[0],
    stripeOutboundPaymentId: outbound.id,
  };
}

function mapOutboundPaymentStatus(status: string): string {
  if (status === "posted") return "paid";
  if (status === "failed" || status === "returned") return "failed";
  if (status === "canceled") return "canceled";
  return "pending";
}

export async function getPayoutById(id: string) {
  const result = await query(`SELECT * FROM payouts WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}
