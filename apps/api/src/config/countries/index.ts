import type { CountryConfig } from "./types.js";
import { jordan } from "./jordan.js";

const registry: Record<string, CountryConfig> = {
  JO: jordan,
};

/** M2: register PK, TR, ID here without changing payout engine. */
export function getCountryConfig(code: string): CountryConfig {
  const key = code.toUpperCase();
  const config = registry[key];
  if (!config) {
    throw new Error(
      `Country not enabled: ${code}. M1 supports JO only; M2 adds PK, TR, ID.`,
    );
  }
  return config;
}

export function listEnabledCountries(): CountryConfig[] {
  return Object.values(registry);
}
