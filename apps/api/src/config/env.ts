import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.join(rootDir, ".env") });
}

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
  /** Pooled URL for serverless (Vercel + Neon integration). */
  databaseUrl: required("DATABASE_URL"),
  /** Direct URL for migrations; falls back to DATABASE_URL. */
  databaseUrlUnpooled:
    process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  adminApiKey: required("ADMIN_API_KEY"),
};
