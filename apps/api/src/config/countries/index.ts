import type { CountryConfig } from "./types.js";
import { jordan } from "./jordan.js";

const registry: Record<string, CountryConfig> = {
  JO: jordan,
};

/**
 * Resolves country-specific defaults (currency, required bank fields).
 * Phase 1: Jordan (JO) only. Add TR and ID modules here in phase 2.
 */
export function getCountryConfig(code: string): CountryConfig {
  const key = code.toUpperCase();
  const config = registry[key];
  if (!config) {
    throw new Error(
      `Country not enabled: ${code}. Phase 1 supports JO (Jordan wire).`,
    );
  }
  return config;
}
