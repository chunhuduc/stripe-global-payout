import type { CountryConfig } from "./types.js";
import { jordan } from "./jordan.js";

const registry: Record<string, CountryConfig> = {
  JO: jordan,
};

/** Phase 2: register TR, ID here. Trial implements JO (wire). */
export function getCountryConfig(code: string): CountryConfig {
  const key = code.toUpperCase();
  const config = registry[key];
  if (!config) {
    throw new Error(
      `Country not enabled: ${code}. Trial supports JO; phase 2 adds TR, ID.`,
    );
  }
  return config;
}

export function listEnabledCountries(): CountryConfig[] {
  return Object.values(registry);
}
