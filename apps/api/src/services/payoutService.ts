import { v4 as uuidv4 } from "uuid";
import { getCountryConfig } from "../config/countries/index.js";
import { query } from "../db/client.js";
import { getPayeeById } from "./payeeService.js";
import { transferAndPayout } from "../stripe/payouts.js";

export interface InitiatePayoutInput {
  payeeId: string;
  amount: number;
  currency?: string;
  transferCurrency?: string;
}

export async function initiatePayout(input: InitiatePayoutInput) {
  const payee = await getPayeeById(input.payeeId);
  if (!payee) {
    throw new Error(`Payee not found: ${input.payeeId}`);
  }

  const country = getCountryConfig(payee.country_code as string);
  const currency = (input.currency ?? country.defaultCurrency).toLowerCase();
  const idempotencyKey = uuidv4();

  const { transfer, payout } = await transferAndPayout({
    connectedAccountId: payee.stripe_account_id as string,
    amount: input.amount,
    currency,
    transferCurrency: input.transferCurrency?.toLowerCase(),
    idempotencyKey,
  });

  const result = await query(
    `INSERT INTO payouts (
       payee_id, stripe_payout_id, stripe_transfer_id,
       amount, currency, status, idempotency_key
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      payee.id,
      payout.id,
      transfer.id,
      input.amount,
      currency,
      mapStripePayoutStatus(payout.status),
      idempotencyKey,
    ],
  );

  return {
    payout: result.rows[0],
    stripePayoutId: payout.id,
    stripeTransferId: transfer.id,
  };
}

function mapStripePayoutStatus(status: string): string {
  if (status === "paid") return "paid";
  if (status === "failed" || status === "canceled") return "failed";
  return "pending";
}

export async function findPayoutByStripePayoutId(stripePayoutId: string) {
  const result = await query(
    `SELECT * FROM payouts WHERE stripe_payout_id = $1`,
    [stripePayoutId],
  );
  return result.rows[0] ?? null;
}
