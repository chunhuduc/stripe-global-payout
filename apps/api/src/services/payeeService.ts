import { getCountryConfig } from "../config/countries/index.js";
import type { CreatePayeeInput } from "../config/countries/types.js";
import { query } from "../db/client.js";
import { createGlobalPayoutRecipient } from "../stripe/recipients.js";

/**
 * Onboard a payee: Global Payouts recipient + wire PayoutMethod, then store Stripe ids locally.
 */
export async function createPayee(input: CreatePayeeInput) {
  getCountryConfig(input.countryCode);

  const stripeResult = await createGlobalPayoutRecipient({
    countryCode: input.countryCode,
    individual: input.individual,
    bank: input.bank,
  });

  const result = await query<{
    id: string;
    country_code: string;
    stripe_recipient_id: string;
    stripe_payout_method_id: string;
    email: string;
    status: string;
    created_at: Date;
  }>(
    `INSERT INTO payees (
       country_code, stripe_recipient_id, stripe_payout_method_id, email, status
     ) VALUES ($1, $2, $3, $4, $5)
     RETURNING id, country_code, stripe_recipient_id, stripe_payout_method_id, email, status, created_at`,
    [
      input.countryCode.toUpperCase(),
      stripeResult.recipientId,
      stripeResult.payoutMethodId,
      input.individual.email,
      stripeResult.recipientStatus,
    ],
  );

  return {
    payee: result.rows[0],
    stripeRecipientId: stripeResult.recipientId,
    stripePayoutMethodId: stripeResult.payoutMethodId,
  };
}

export async function getPayeeById(id: string) {
  const result = await query(
    `SELECT id, country_code, stripe_recipient_id, stripe_payout_method_id, email, status, created_at
     FROM payees WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}
