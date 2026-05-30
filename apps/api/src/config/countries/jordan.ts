import type { CountryConfig } from "./types.js";

/** Jordan (JO): cross-border payout only on Stripe; bank via IBAN + SWIFT/BIC. */
export const jordan: CountryConfig = {
  code: "JO",
  name: "Jordan",
  defaultCurrency: "jod",
  requiresIban: true,
  requiresSwift: true,
};
