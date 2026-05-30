import type Stripe from "stripe";
import { stripe } from "./client.js";

export interface TransferAndPayoutParams {
  connectedAccountId: string;
  amount: number;
  currency: string;
  transferCurrency?: string;
  idempotencyKey?: string;
}

export interface TransferAndPayoutResult {
  transfer: Stripe.Transfer;
  payout: Stripe.Payout;
}

/**
 * Fund connected account balance, then payout to recipient bank.
 * Platform balance must cover the transfer (top up in Stripe test Dashboard).
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
