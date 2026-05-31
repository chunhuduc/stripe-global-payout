import { env } from "../config/env.js";

export class StripeV2Error extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "StripeV2Error";
  }
}

type V2RequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  /** Recipient account id for Stripe-Context header. */
  stripeContext?: string;
};

/**
 * Stripe API v2 (Global Payouts: Accounts v2, Outbound Setup Intents, Outbound Payments).
 * Node SDK v1 does not cover these; use fetch with preview Stripe-Version.
 */
export async function stripeV2Request<T>(
  path: string,
  options: V2RequestOptions = {},
): Promise<T> {
  const method = options.method ?? (options.body ? "POST" : "GET");
  const url = path.startsWith("http") ? path : `https://api.stripe.com${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${env.stripeSecretKey}`,
    "Stripe-Version": env.stripeApiVersion,
    "Content-Type": "application/json",
  };

  if (options.stripeContext) {
    headers["Stripe-Context"] = options.stripeContext;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof parsed === "object" &&
      parsed !== null &&
      "error" in parsed &&
      typeof (parsed as { error?: { message?: string } }).error?.message === "string"
        ? (parsed as { error: { message: string } }).error.message
        : `Stripe v2 ${method} ${path} failed (${response.status})`;
    throw new StripeV2Error(message, response.status, parsed);
  }

  return parsed as T;
}
