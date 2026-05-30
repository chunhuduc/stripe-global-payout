import type { CountryConfig } from "@aaron-payout/shared";

export type { CountryConfig };

export interface BankInput {
  iban: string;
  swift: string;
  accountHolderName: string;
}

export interface IndividualInput {
  firstName: string;
  lastName: string;
  email: string;
}

export interface CreatePayeeInput {
  countryCode: string;
  individual: IndividualInput;
  bank: BankInput;
}
