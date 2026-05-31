import { loadProjectEnv } from "./loadEnv.js";

loadProjectEnv();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  stripeSecretKey: required("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: required("STRIPE_WEBHOOK_SECRET"),
  /** Global Payouts v2 preview version (Accounts v2, Outbound Payments). */
  stripeApiVersion: process.env.STRIPE_API_VERSION ?? "2026-05-27.preview",
  /** Optional until admin payout demo (step 4+). From Dashboard > Global Payouts > Financial account. */
  stripeFinancialAccountId: process.env.STRIPE_FINANCIAL_ACCOUNT_ID ?? "",
  /** Pooled URL for serverless (Vercel + Neon integration). */
  databaseUrl: required("DATABASE_URL"),
  /** Direct URL for migrations; falls back to DATABASE_URL. */
  databaseUrlUnpooled:
    process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  adminApiKey: required("ADMIN_API_KEY"),
};
