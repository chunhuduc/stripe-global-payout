import { env } from "../config/env.js";
import { stripeV2Request } from "./v2Client.js";

export type CreateOutboundPaymentParams = {
  recipientId: string;
  payoutMethodId: string;
  /** Minor units (e.g. 1000 = 10.00 JOD). */
  amount: number;
  currency: string;
  description?: string;
};

export type OutboundPayment = {
  id: string;
  status: string;
};

/**
 * Global Payouts: send money from platform Financial Account to recipient PayoutMethod.
 * Requires STRIPE_FINANCIAL_ACCOUNT_ID.
 */
export async function createOutboundPayment(
  params: CreateOutboundPaymentParams,
): Promise<OutboundPayment> {
  if (!env.stripeFinancialAccountId) {
    throw new Error(
      "STRIPE_FINANCIAL_ACCOUNT_ID is not set. Fund Global Payouts Financial Account in Dashboard first.",
    );
  }

  const currency = params.currency.toLowerCase();

  return stripeV2Request<OutboundPayment>("/v2/money_management/outbound_payments", {
    method: "POST",
    body: {
      // Financial account is typically USD on a US platform; amount.currency is the payee payout currency.
      from: {
        financial_account: env.stripeFinancialAccountId,
        currency: "usd",
      },
      to: {
        recipient: params.recipientId,
        payout_method: params.payoutMethodId,
      },
      amount: {
        value: params.amount,
        currency,
      },
      description: params.description ?? "Freelancer payout",
    },
  });
}
