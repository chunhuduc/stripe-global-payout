import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);

/** Repo root (parent of apps/api). */
export const projectRoot = rootDir;

/**
 * Local dev: `.env` then `.env.local` (local overrides).
 * Production (Vercel): use platform env only.
 */
export function loadProjectEnv(): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  dotenv.config({ path: path.join(rootDir, ".env") });
  dotenv.config({ path: path.join(rootDir, ".env.local"), override: true });
}
