import type { BankInput, IndividualInput } from "../config/countries/types.js";
import { stripeV2Request } from "./v2Client.js";

type RecipientCapabilityStatus = "active" | "restricted" | "pending" | string;

type RecipientAccount = {
  id: string;
  display_name: string;
  contact_email: string;
  configuration?: {
    recipient?: {
      capabilities?: {
        bank_accounts?: {
          wire?: { status?: RecipientCapabilityStatus };
        };
      };
    };
  };
};

type OutboundSetupIntent = {
  id: string;
  payout_method?: {
    id: string;
    type?: string;
  };
};

export type CreateGlobalPayoutRecipientResult = {
  recipientId: string;
  payoutMethodId: string;
  recipientStatus: string;
};

function stripeCountryCode(iso2: string): string {
  return iso2.toLowerCase();
}

/**
 * Global Payouts payee onboarding (Stripe-side):
 * 1. Create Accounts v2 recipient with wire capability
 * 2. Submit individual identity
 * 3. Outbound Setup Intent to attach IBAN/SWIFT as PayoutMethod
 */
export async function createGlobalPayoutRecipient(params: {
  countryCode: string;
  individual: IndividualInput;
  bank: BankInput;
}): Promise<CreateGlobalPayoutRecipientResult> {
  const country = stripeCountryCode(params.countryCode);
  const displayName = `${params.individual.firstName} ${params.individual.lastName}`.trim();

  const created = await stripeV2Request<RecipientAccount>("/v2/core/accounts", {
    method: "POST",
    body: {
      contact_email: params.individual.email,
      display_name: displayName,
      identity: {
        country,
        entity_type: "individual",
      },
      configuration: {
        recipient: {
          capabilities: {
            bank_accounts: {
              wire: { requested: true },
            },
          },
        },
      },
      include: ["identity", "configuration.recipient", "requirements"],
    },
  });

  await stripeV2Request<RecipientAccount>(`/v2/core/accounts/${created.id}`, {
    method: "POST",
    body: {
      contact_email: params.individual.email,
      display_name: displayName,
      identity: {
        country,
        entity_type: "individual",
        individual: {
          given_name: params.individual.firstName,
          surname: params.individual.lastName,
        },
      },
      include: ["identity", "configuration.recipient"],
    },
  });

  const setupIntent = await stripeV2Request<OutboundSetupIntent>(
    "/v2/money_management/outbound_setup_intents",
    {
      method: "POST",
      stripeContext: created.id,
      body: {
        payout_method_data: {
          type: "bank_account",
          bank_account: {
            country: params.countryCode.toUpperCase(),
            account_number: params.bank.iban,
            routing_number: params.bank.swift,
          },
        },
      },
    },
  );

  const payoutMethodId = setupIntent.payout_method?.id;
  if (!payoutMethodId) {
    throw new Error("Stripe did not return a payout_method id from Outbound Setup Intent");
  }

  const updated = await stripeV2Request<RecipientAccount>(
    `/v2/core/accounts/${created.id}?include[0]=configuration.recipient`,
    { method: "GET" },
  );

  const wireStatus =
    updated.configuration?.recipient?.capabilities?.bank_accounts?.wire?.status ??
    "restricted";

  return {
    recipientId: created.id,
    payoutMethodId,
    recipientStatus: wireStatus === "active" ? "active" : "restricted",
  };
}
