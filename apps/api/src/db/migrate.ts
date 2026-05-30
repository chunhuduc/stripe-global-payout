import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { loadProjectEnv } from "../config/loadEnv.js";

loadProjectEnv();

if (typeof globalThis.WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "migrations");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Set it in .env.local or .env at the repo root.`,
    );
  }
  return value;
}

async function migrate() {
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED ??
    requireEnv("DATABASE_URL");
  const pool = new Pool({ connectionString });

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`Running migration: ${file}`);
    await pool.query(sql);
  }

  console.log("Migrations complete.");
  await pool.end();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
