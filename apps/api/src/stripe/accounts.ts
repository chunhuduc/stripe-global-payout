import type Stripe from "stripe";
import { stripe } from "./client.js";
import type { BankInput, IndividualInput } from "../config/countries/types.js";

export interface CreateCustomAccountParams {
  country: string;
  individual: IndividualInput;
}

/**
 * Connect Custom account: recipient never logs into Stripe.
 * Cross-border destinations (JO, PK, TR, ID) use country on the connected account.
 */
export async function createCustomConnectedAccount(
  params: CreateCustomAccountParams,
): Promise<Stripe.Account> {
  const now = Math.floor(Date.now() / 1000);

  return stripe.accounts.create({
    type: "custom",
    country: params.country,
    email: params.individual.email,
    business_type: "individual",
    individual: {
      first_name: params.individual.firstName,
      last_name: params.individual.lastName,
      email: params.individual.email,
    },
    capabilities: {
      transfers: { requested: true },
    },
    // M1/test: platform records acceptance; production should use real IP and onboarding flow.
    tos_acceptance: {
      date: now,
      ip: "127.0.0.1",
    },
  });
}

/**
 * Attach external bank account (IBAN + SWIFT for Jordan).
 * Recipient does not need a Stripe Dashboard.
 */
export async function attachBankAccount(
  stripeAccountId: string,
  bank: BankInput,
  currency: string,
  country: string,
): Promise<Stripe.BankAccount | Stripe.ExternalAccount> {
  return stripe.accounts.createExternalAccount(stripeAccountId, {
    external_account: {
      object: "bank_account",
      country,
      currency,
      account_holder_name: bank.accountHolderName,
      account_holder_type: "individual",
      // Stripe cross-border: routing_number holds SWIFT/BIC; account_number holds IBAN.
      routing_number: bank.swift,
      account_number: bank.iban,
    },
  });
}
