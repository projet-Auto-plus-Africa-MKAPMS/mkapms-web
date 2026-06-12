// Multi-devises (cahier des charges §8.6) — détection auto selon le pays.
// Taux indicatifs (1 EUR = X). À synchroniser avec un fournisseur de taux en prod.

export interface CurrencyDef {
  code: string;
  symbol: string;
  rateFromEur: number;
  locale: string;
}

export const CURRENCIES: Record<string, CurrencyDef> = {
  EUR: { code: "EUR", symbol: "€", rateFromEur: 1, locale: "fr-FR" },
  USD: { code: "USD", symbol: "$", rateFromEur: 1.08, locale: "en-US" },
  GBP: { code: "GBP", symbol: "£", rateFromEur: 0.85, locale: "en-GB" },
  XOF: { code: "XOF", symbol: "FCFA", rateFromEur: 655.957, locale: "fr-FR" },
  XAF: { code: "XAF", symbol: "FCFA", rateFromEur: 655.957, locale: "fr-FR" },
  MAD: { code: "MAD", symbol: "DH", rateFromEur: 10.8, locale: "fr-MA" },
  DZD: { code: "DZD", symbol: "DA", rateFromEur: 145, locale: "fr-DZ" },
  TND: { code: "TND", symbol: "DT", rateFromEur: 3.4, locale: "fr-TN" },
  GNF: { code: "GNF", symbol: "FG", rateFromEur: 9300, locale: "fr-FR" },
  CAD: { code: "CAD", symbol: "$", rateFromEur: 1.46, locale: "fr-CA" },
};

// Pays -> devise (couverture principale Europe + Afrique francophone)
export const COUNTRY_CURRENCY: Record<string, string> = {
  FR: "EUR", BE: "EUR", DE: "EUR", ES: "EUR", IT: "EUR", PT: "EUR", LU: "EUR",
  US: "USD", GB: "GBP",
  SN: "XOF", CI: "XOF", ML: "XOF", BF: "XOF", BJ: "XOF", TG: "XOF", NE: "XOF",
  CM: "XAF", GA: "XAF", CG: "XAF", TD: "XAF",
  MA: "MAD", DZ: "DZD", TN: "TND", GN: "GNF", CA: "CAD",
};

export function currencyForCountry(country?: string | null): string {
  if (!country) return "EUR";
  return COUNTRY_CURRENCY[country.toUpperCase()] || "EUR";
}

export function convertFromEur(amountEur: number, currency: string): number {
  const def = CURRENCIES[currency] || CURRENCIES.EUR;
  return amountEur * def.rateFromEur;
}

export function formatPrice(amountEur: number, currency = "EUR"): string {
  const def = CURRENCIES[currency] || CURRENCIES.EUR;
  const value = convertFromEur(amountEur, currency);
  const noDecimals = ["XOF", "XAF", "GNF", "DZD"].includes(def.code);
  return new Intl.NumberFormat(def.locale, {
    style: "currency",
    currency: def.code,
    maximumFractionDigits: noDecimals ? 0 : 2,
  }).format(value);
}
