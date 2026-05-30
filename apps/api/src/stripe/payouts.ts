import type Stripe from "stripe";
import { stripe } from "./client.js";

export interface TransferAndPayoutParams {
  connectedAccountId: string;
  /** Amount in minor units (e.g. 1000 = 10.00 in that currency). */
  amount: number;
  currency: string;
  /** Platform balance currency for the transfer step (often usd if platform holds USD). */
  transferCurrency?: string;
  idempotencyKey?: string;
}

export interface TransferAndPayoutResult {
  transfer: Stripe.Transfer;
  payout: Stripe.Payout;
}

/**
 * Two-step payout on Connect:
 * 1) Transfer from platform balance to the connected account.
 * 2) Payout from connected account to the payee bank.
 * Platform test balance must be topped up before step 1 (Stripe Dashboard).
 */
export async function transferAndPayout(
  params: TransferAndPayoutParams,
): Promise<TransferAndPayoutResult> {
  const transferCurrency = params.transferCurrency ?? params.currency;

  const transfer = await stripe.transfers.create(
    {
      amount: params.amount,
      currency: transferCurrency,
      destination: params.connectedAccountId,
    },
    params.idempotencyKey
      ? { idempotencyKey: `${params.idempotencyKey}-transfer` }
      : undefined,
  );

  const payout = await stripe.payouts.create(
    {
      amount: params.amount,
      currency: params.currency,
    },
    {
      stripeAccount: params.connectedAccountId,
      ...(params.idempotencyKey
        ? { idempotencyKey: `${params.idempotencyKey}-payout` }
        : {}),
    },
  );

  return { transfer, payout };
}
