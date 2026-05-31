import { v4 as uuidv4 } from "uuid";
import { getCountryConfig } from "../config/countries/index.js";
import { query } from "../db/client.js";
import { createOutboundPayment } from "../stripe/outboundPayments.js";
import { getPayeeById } from "./payeeService.js";

export interface InitiatePayoutInput {
  payeeId: string;
  /** Minor units (Stripe integer amount). */
  amount: number;
  currency?: string;
}

/**
 * Admin-initiated outbound payment (Global Payouts).
 * Final status arrives via v2.money_management.outbound_payment.* webhooks.
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
  if (status === "failed" || status === "canceled" || status === "returned") {
    return status === "canceled" ? "canceled" : "failed";
  }
  return "pending";
}

export async function findPayoutByOutboundPaymentId(stripeOutboundPaymentId: string) {
  const result = await query(
    `SELECT * FROM payouts WHERE stripe_outbound_payment_id = $1`,
    [stripeOutboundPaymentId],
  );
  return result.rows[0] ?? null;
}

export async function getPayoutById(id: string) {
  const result = await query(`SELECT * FROM payouts WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}
