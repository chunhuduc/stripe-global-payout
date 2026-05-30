import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { env } from "../config/env.js";

// Neon serverless driver uses WebSockets in Node (not required on Node 22+ with native WebSocket).
if (typeof globalThis.WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

/** Pooled DATABASE_URL (Vercel + Neon integration). */
export const pool = new Pool({ connectionString: env.databaseUrl });

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[],
) {
  return pool.query<T>(text, params);
}
