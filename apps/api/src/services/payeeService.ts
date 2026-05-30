import { getCountryConfig } from "../config/countries/index.js";
import type { CreatePayeeInput } from "../config/countries/types.js";
import { query } from "../db/client.js";
import {
  attachBankAccount,
  createCustomConnectedAccount,
} from "../stripe/accounts.js";

/**
 * Onboard a payee: Custom connected account + external bank, then store Stripe ids locally.
 */
export async function createPayee(input: CreatePayeeInput) {
  const country = getCountryConfig(input.countryCode);

  const account = await createCustomConnectedAccount({
    country: country.code,
    individual: input.individual,
  });

  await attachBankAccount(
    account.id,
    input.bank,
    country.defaultCurrency,
    country.code,
  );

  const result = await query<{
    id: string;
    country_code: string;
    stripe_account_id: string;
    email: string;
    status: string;
    created_at: Date;
  }>(
    `INSERT INTO payees (country_code, stripe_account_id, email, status)
     VALUES ($1, $2, $3, $4)
     RETURNING id, country_code, stripe_account_id, email, status, created_at`,
    [
      country.code,
      account.id,
      input.individual.email,
      // New Custom accounts are often "restricted" until requirements are met; normal in test mode.
      account.charges_enabled ? "active" : "restricted",
    ],
  );

  return {
    payee: result.rows[0],
    stripeAccountId: account.id,
  };
}

export async function getPayeeById(id: string) {
  const result = await query(
    `SELECT id, country_code, stripe_account_id, email, status, created_at
     FROM payees WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}
