import { ValidationError } from "./errors";

export type CurrencyCode = string;

export type Money = {
  readonly minor: number;
  readonly currency: CurrencyCode;
};

export function money(minor: number, currency: CurrencyCode): Money {
  if (!Number.isInteger(minor)) {
    throw new ValidationError("Money minor units must be an integer");
  }
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new ValidationError("Currency must be a 3-letter ISO code");
  }
  return { minor, currency };
}
