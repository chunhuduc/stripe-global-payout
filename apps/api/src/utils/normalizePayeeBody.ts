import type { CreatePayeeInput } from "../config/countries/types.js";

type RawPayeeBody = {
  countryCode?: string;
  name?: string;
  email?: string;
  individual?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  bank?: {
    iban?: string;
    swift?: string;
    accountHolderName?: string;
  };
};

/**
 * Accepts shorthand `{ name, bank }` or full `{ individual, bank, countryCode }`.
 */
export function normalizePayeeBody(body: RawPayeeBody): CreatePayeeInput | null {
  if (!body.bank?.iban || !body.bank?.swift) {
    return null;
  }

  const countryCode = (body.countryCode ?? "JO").toUpperCase();

  let firstName: string;
  let lastName: string;
  let email: string;

  if (body.individual?.firstName && body.individual?.lastName) {
    firstName = body.individual.firstName;
    lastName = body.individual.lastName;
    email = body.individual.email ?? body.email ?? "";
  } else if (body.name?.trim()) {
    const parts = body.name.trim().split(/\s+/);
    firstName = parts[0] ?? body.name.trim();
    lastName = parts.slice(1).join(" ") || firstName;
    email = body.email ?? body.individual?.email ?? "";
  } else {
    return null;
  }

  if (!email) {
    const slug = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z0-9.]/g, "");
    email = `${slug || "freelancer"}@example.test`;
  }

  const accountHolderName =
    body.bank.accountHolderName?.trim() || `${firstName} ${lastName}`.trim();

  return {
    countryCode,
    individual: { firstName, lastName, email },
    bank: {
      iban: body.bank.iban,
      swift: body.bank.swift,
      accountHolderName,
    },
  };
}
