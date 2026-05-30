export type PayoutStatus = "pending" | "paid" | "failed" | "canceled";

export type PayeeStatus = "restricted" | "pending" | "active";

export interface CountryConfig {
  code: string;
  name: string;
  defaultCurrency: string;
  requiresIban: boolean;
  requiresSwift: boolean;
}
