/** Per-country payout rules (currency, required bank fields). */
export interface CountryConfig {
  code: string;
  name: string;
  defaultCurrency: string;
  requiresIban: boolean;
  requiresSwift: boolean;
}

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
